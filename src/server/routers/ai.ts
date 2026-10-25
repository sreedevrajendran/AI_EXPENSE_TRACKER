import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { GoogleGenAI } from "@google/genai";
import { parseBankStatementPdf } from "@/lib/bankStatementParser";
import { classifyTransaction } from "@/lib/ml/transactionClassifier";
import { answerFinancialQuery, buildRichPromptContext, FinancialContext } from "@/lib/ai/financialAssistant";
import { retrieveFinancialContext, RAGCitation } from "@/lib/ai/ragEngine";
import { formatCurrency, getCurrencyConfig } from "@/lib/utils";

// Initialize Gemini dynamically on request to ensure process.env.GEMINI_API_KEY is available in serverless environments
const getGeminiClient = () => {
    if (!process.env.GEMINI_API_KEY) {
        throw new Error("Missing GEMINI_API_KEY environment variable");
    }
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

function parseTransactionIntent(text: string) {
    if (!text || text.trim().length === 0) return null;
    const lower = text.toLowerCase();
    
    // Check for transaction keywords
    const isExpense = lower.includes("spent") || lower.includes("expense") || lower.includes("bought") || lower.includes("paid") || lower.includes("buy");
    const isIncome = lower.includes("income") || lower.includes("earned") || lower.includes("salary") || lower.includes("received") || lower.includes("got");
    
    // Extract numerical amount
    const amountMatch = text.match(/(?:₹|\$|€|£|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)/i);
    if (!amountMatch) return null;
    const amount = parseFloat(amountMatch[1]);
    if (isNaN(amount) || amount <= 0) return null;
    
    // Payment method
    let paymentMethod: "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "OTHER" = "UPI";
    if (lower.includes("cash")) paymentMethod = "CASH";
    else if (lower.includes("card") || lower.includes("credit") || lower.includes("debit")) paymentMethod = "CARD";
    else if (lower.includes("bank") || lower.includes("transfer") || lower.includes("neft") || lower.includes("rtgs")) paymentMethod = "BANK_TRANSFER";
    else if (lower.includes("upi") || lower.includes("gpay") || lower.includes("paytm") || lower.includes("phonepe")) paymentMethod = "UPI";
    
    if (isIncome && !isExpense) {
        let source = "Income";
        const fromMatch = text.match(/(?:from|source|via)\s+([a-zA-Z0-9\s&]+)/i);
        if (fromMatch) source = fromMatch[1].trim();
        else if (lower.includes("salary")) source = "Salary";
        else if (lower.includes("freelance")) source = "Freelance";
        else if (lower.includes("bonus")) source = "Bonus";
        return {
            type: "income" as const,
            amount,
            merchant: source.charAt(0).toUpperCase() + source.slice(1),
            date: new Date().toISOString(),
        };
    }
    
    if (isExpense || amount > 0) {
        let merchant = "Expense";
        const forMatch = text.match(/(?:for|at|on)\s+([a-zA-Z0-9\s&]+)/i);
        if (forMatch) merchant = forMatch[1].replace(/with.*|via.*|using.*|through.*/i, "").trim();
        else if (lower.includes("coffee")) merchant = "Coffee & Bakery";
        else if (lower.includes("groceries") || lower.includes("grocery")) merchant = "Supermarket Groceries";
        else if (lower.includes("lunch") || lower.includes("dinner") || lower.includes("food")) merchant = "Dining & Food";
        else if (lower.includes("uber") || lower.includes("cab") || lower.includes("taxi")) merchant = "Taxi Cab Ride";
        
        let category = "Other";
        if (lower.includes("food") || lower.includes("coffee") || lower.includes("lunch") || lower.includes("dinner") || lower.includes("restaurant") || lower.includes("cafe")) {
            category = "Food & Dining";
        } else if (lower.includes("grocery") || lower.includes("supermarket") || lower.includes("groceries") || lower.includes("vegetables") || lower.includes("fruits")) {
            category = "Groceries";
        } else if (lower.includes("uber") || lower.includes("cab") || lower.includes("fuel") || lower.includes("petrol") || lower.includes("flight") || lower.includes("train") || lower.includes("bus")) {
            category = "Transport";
        } else if (lower.includes("shopping") || lower.includes("amazon") || lower.includes("clothes") || lower.includes("shoes") || lower.includes("mall")) {
            category = "Shopping";
        } else if (lower.includes("bill") || lower.includes("electricity") || lower.includes("wifi") || lower.includes("internet") || lower.includes("water") || lower.includes("rent")) {
            category = "Bills & Utilities";
        } else if (lower.includes("movie") || lower.includes("netflix") || lower.includes("cinema") || lower.includes("game")) {
            category = "Entertainment";
        } else {
            try {
                const ml = classifyTransaction(text, amount);
                if (ml && ml.confidence >= 0.25 && ml.category && ml.category !== "Other") {
                    category = ml.category;
                }
            } catch {
                // ignore
            }
        }
        
        return {
            type: "expense" as const,
            amount,
            merchant: merchant.charAt(0).toUpperCase() + merchant.slice(1),
            category,
            paymentMethod,
            date: new Date().toISOString(),
        };
    }
    
    return null;
}

const VALID_PAYMENT_METHODS = ["CASH", "CREDIT_CARD", "DEBIT_CARD", "UPI", "NET_BANKING", "BANK_TRANSFER", "OTHER"] as const;

function sanitizePaymentMethod(val?: any): "CASH" | "CREDIT_CARD" | "DEBIT_CARD" | "UPI" | "NET_BANKING" | "BANK_TRANSFER" | "OTHER" {
    if (!val || typeof val !== "string") return "UPI";
    const clean = val.toUpperCase().trim().replace(/[\s-]+/g, "_");
    if (clean === "CARD" || clean === "CREDIT" || clean.includes("CREDIT")) return "CREDIT_CARD";
    if (clean === "DEBIT" || clean.includes("DEBIT")) return "DEBIT_CARD";
    if (clean.includes("UPI") || clean.includes("GPAY") || clean.includes("PHONEPE") || clean.includes("PAYTM") || clean.includes("BHIM") || clean.includes("CRED")) return "UPI";
    if (clean.includes("NET") || clean.includes("IMPS") || clean.includes("NEFT") || clean.includes("RTGS")) return "NET_BANKING";
    if (clean.includes("BANK") || clean.includes("TRANSFER")) return "BANK_TRANSFER";
    if (clean.includes("CASH")) return "CASH";
    return (VALID_PAYMENT_METHODS as readonly string[]).includes(clean) ? (clean as any) : "UPI";
}

const VALID_CATEGORIES = [
    "Food & Dining",
    "Groceries",
    "Shopping",
    "Transport",
    "Bills & Utilities",
    "Entertainment",
    "Health",
    "Travel",
    "Investments",
    "Salary",
    "UPI Transfer",
    "Transfers",
    "Cashback & Rewards",
    "Interest & Dividends",
    "Refunds",
    "Education",
    "Other",
] as const;

function sanitizeCategory(val?: any): string {
    if (!val || typeof val !== "string") return "Other";
    const found = VALID_CATEGORIES.find(c => c.toLowerCase() === val.trim().toLowerCase());
    if (found) return found;
    for (const c of VALID_CATEGORIES) {
        if (val.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(val.toLowerCase())) {
            return c;
        }
    }
    return "Other";
}

function formatPaymentNote(fields: {
    invoiceNumber?: string | null;
    referenceId?: string | null;
    upiId?: string | null;
    cardLast4?: string | null;
    bankName?: string | null;
    consumerNumber?: string | null;
    subtotal?: number | null;
    tax?: number | null;
    discount?: number | null;
    dueDate?: string | null;
    status?: string | null;
    existingNote?: string | null;
}): string {
    const parts: string[] = [];
    if (fields.invoiceNumber) parts.push(`Invoice #${fields.invoiceNumber}`);
    if (fields.referenceId) parts.push(`Ref: ${fields.referenceId}`);
    if (fields.upiId) parts.push(`UPI: ${fields.upiId}`);
    if (fields.cardLast4) parts.push(`Card ending ${fields.cardLast4}`);
    if (fields.bankName) parts.push(`Bank: ${fields.bankName}`);
    if (fields.consumerNumber) parts.push(`Consumer ID: ${fields.consumerNumber}`);
    if (fields.subtotal && fields.subtotal > 0) parts.push(`Subtotal: ₹${fields.subtotal}`);
    if (fields.tax && fields.tax > 0) parts.push(`Tax/GST: ₹${fields.tax}`);
    if (fields.discount && fields.discount > 0) parts.push(`Discount: -₹${fields.discount}`);
    if (fields.dueDate) parts.push(`Due Date: ${fields.dueDate}`);
    if (fields.status && fields.status.toUpperCase() === "DUE") parts.push(`Status: PAYMENT DUE`);

    if (parts.length > 0) {
        return parts.join(" • ");
    }
    return fields.existingNote || "Receipt Uploaded";
}

export const aiRouter = router({
    scanReceipt: protectedProcedure
        .input(
            z.object({
                imageBase64: z.string(),
                mimeType: z.string().default("image/jpeg"),
            })
        )
        .mutation(async ({ input }) => {
            if (!process.env.GEMINI_API_KEY) {
                return {
                    amount: null,
                    merchant: "Receipt Uploaded",
                    date: new Date().toISOString().split("T")[0],
                    category: "Other",
                    paymentMethod: "UPI",
                    note: "Receipt scanned without API key. Please configure GEMINI_API_KEY for automatic data extraction.",
                };
            }

            try {
                const prompt = `Extract all payment and transaction data from this receipt or bill image. Return ONLY a raw JSON object with NO markdown formatting:
{
  "amount": <positive number for grand total>,
  "merchant": "<clean merchant, store, or payee name>",
  "date": "<YYYY-MM-DD>",
  "time": "<HH:MM or null>",
  "category": "<Food & Dining | Groceries | Shopping | Transport | Bills & Utilities | Entertainment | Health | Travel | Investments | Salary | UPI Transfer | Transfers | Cashback & Rewards | Interest & Dividends | Refunds | Education | Other>",
  "paymentMethod": "<UPI | CREDIT_CARD | DEBIT_CARD | NET_BANKING | BANK_TRANSFER | CASH | OTHER>",
  "invoiceNumber": "<Invoice #, Bill #, Order ID, or Receipt # if visible, otherwise null>",
  "referenceId": "<UPI UTR (12 digits), Txn ID, or Bank Ref # if visible, otherwise null>",
  "upiId": "<VPA address e.g. merchant@upi or null>",
  "cardLast4": "<last 4 digits of card or null>",
  "bankName": "<bank name or null>",
  "subtotal": <subtotal before tax as number, or null>,
  "tax": <total GST, VAT, or tax amount as number, or null>,
  "discount": <discount amount as number, or null>,
  "status": "<'PAID' or 'DUE'>",
  "dueDate": "<YYYY-MM-DD or null>",
  "note": "<concise summary of invoice, ref ID, tax, etc.>"
}`;

                const ai = getGeminiClient();
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: input.mimeType,
                                        data: input.imageBase64,
                                    },
                                },
                            ],
                        },
                    ],
                    config: {
                        temperature: 0,
                        responseMimeType: "application/json",
                    },
                });

                const text = response.text || "{}";
                let parsed: any;
                try {
                    parsed = JSON.parse(text);
                } catch {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
                }

                const pm = sanitizePaymentMethod(parsed.paymentMethod);
                const category = sanitizeCategory(parsed.category);
                const note = formatPaymentNote({
                    invoiceNumber: parsed.invoiceNumber,
                    referenceId: parsed.referenceId,
                    upiId: parsed.upiId,
                    cardLast4: parsed.cardLast4,
                    bankName: parsed.bankName,
                    subtotal: parsed.subtotal ? parseFloat(parsed.subtotal) : null,
                    tax: parsed.tax ? parseFloat(parsed.tax) : null,
                    discount: parsed.discount ? parseFloat(parsed.discount) : null,
                    dueDate: parsed.dueDate,
                    status: parsed.status,
                    existingNote: parsed.note,
                });

                return {
                    amount: typeof parsed.amount === "number" ? parsed.amount : (parseFloat(parsed.amount) || null),
                    merchant: parsed.merchant || "Merchant",
                    date: parsed.date || new Date().toISOString().split("T")[0],
                    time: parsed.time || null,
                    category,
                    paymentMethod: pm,
                    invoiceNumber: parsed.invoiceNumber || null,
                    referenceId: parsed.referenceId || null,
                    upiId: parsed.upiId || null,
                    cardLast4: parsed.cardLast4 || null,
                    bankName: parsed.bankName || null,
                    subtotal: parsed.subtotal ? parseFloat(parsed.subtotal) : null,
                    tax: parsed.tax ? parseFloat(parsed.tax) : null,
                    discount: parsed.discount ? parseFloat(parsed.discount) : null,
                    status: parsed.status || "PAID",
                    dueDate: parsed.dueDate || null,
                    note,
                };
            } catch (error: any) {
                console.error("Gemini API error:", error);
                throw new Error("Failed to process the receipt. Please try again.");
            }
        }),

    scanDocument: protectedProcedure
        .input(
            z.object({
                imageBase64: z.string(),
                mimeType: z.string().default("image/jpeg"),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const isPdf = input.mimeType === "application/pdf" || input.mimeType.includes("pdf");

            // For PDF Bank Statements: Always check if it contains a multi-transaction table
            if (isPdf) {
                try {
                    const pdfBuffer = Buffer.from(input.imageBase64, "base64");
                    const statementResult = await parseBankStatementPdf(pdfBuffer);

                    // Only treat as multi-row bank statement if 2 or more transactions were extracted
                    if (statementResult.transactions.length >= 2) {
                        return {
                            type: "statement",
                            bankName: statementResult.bankName,
                            statementPeriod: statementResult.statementPeriod,
                            totalTransactions: statementResult.totalTransactions,
                            totalExpenses: statementResult.totalExpenses,
                            totalIncomes: statementResult.totalIncomes,
                            transactions: statementResult.transactions,
                        };
                    }
                } catch (pdfErr) {
                    console.error("Open-source PDF parser error:", pdfErr);
                }
            }

            // If no Gemini API key configured, provide structured offline fallback
            if (!process.env.GEMINI_API_KEY) {
                if (isPdf) {
                    try {
                        const pdfBuffer = Buffer.from(input.imageBase64, "base64");
                        const { extractText } = await import("unpdf");
                        const extractRes = await extractText(pdfBuffer, { mergePages: true });
                        const rawText = Array.isArray(extractRes.text) ? extractRes.text.join("\n") : (extractRes.text || "");

                        if (rawText && rawText.trim().length > 0) {
                            const amtMatch = rawText.match(/(?:total|amount payable|grand total|net amount|amt paid|balance due)[:\s]+(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i)
                                || rawText.match(/(?:₹|rs\.?|inr)\s*([\d,]+(?:\.\d{1,2})?)/i);
                            const parsedAmt = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, "")) : 0;

                            const invMatch = rawText.match(/(?:invoice\s*(?:no|num|number)?|bill\s*(?:no|num|number)?|receipt\s*(?:no|num|number)?|order\s*(?:id|no|#))[:\s#]*([a-zA-Z0-9\-_/]+)/i);
                            const refMatch = rawText.match(/(?:utr|ref\s*(?:no|num|id)?|txn\s*(?:id|no)?|upi\s*ref)[:\s#]*([a-zA-Z0-9\-_/]+)/i);
                            const taxMatch = rawText.match(/(?:gst|tax|cgst|sgst|vat)[:\s]+(?:₹|rs\.?|inr)?\s*([\d,]+(?:\.\d{1,2})?)/i);

                            const lines = rawText.split("\n").map(l => l.trim()).filter(l => l.length > 2);
                            const merchant = lines[0] ? lines[0].slice(0, 40) : "PDF Invoice";

                            return {
                                type: "expense",
                                data: {
                                    merchant,
                                    amount: parsedAmt,
                                    date: new Date().toISOString().split("T")[0],
                                    category: "Bills & Utilities",
                                    paymentMethod: "UPI",
                                    invoiceNumber: invMatch ? invMatch[1].trim() : null,
                                    referenceId: refMatch ? refMatch[1].trim() : null,
                                    tax: taxMatch ? parseFloat(taxMatch[1].replace(/,/g, "")) : null,
                                    note: [
                                        invMatch ? `Invoice #${invMatch[1].trim()}` : "",
                                        refMatch ? `Ref: ${refMatch[1].trim()}` : "",
                                        taxMatch ? `Tax: ₹${taxMatch[1].replace(/,/g, "")}` : "",
                                    ].filter(Boolean).join(" • ") || "Uploaded PDF Bill",
                                }
                            };
                        }
                    } catch (e) {
                        console.error("Offline invoice parse fallback failed:", e);
                    }

                    return {
                        type: "error",
                        reason: "Could not read this PDF document. Please configure GEMINI_API_KEY in .env.local for automatic multimodal bill & invoice recognition.",
                    };
                }

                return {
                    type: "expense",
                    data: {
                        merchant: "Document Uploaded",
                        amount: 0,
                        date: new Date().toISOString().split("T")[0],
                        category: "Other",
                        paymentMethod: "UPI",
                        note: "Configure GEMINI_API_KEY in .env.local for full AI receipt OCR",
                    },
                };
            }

            const prompt = `You are a high-accuracy multimodal financial intelligence engine.
Your task is to analyze this uploaded file and determine whether it is an authentic financial document.

CRITICAL FIRST STEP - STRICT DOCUMENT CLASSIFICATION:
1. Determine if the file is a GENUINE FINANCIAL DOCUMENT (e.g., printed retail receipt, supermarket bill, dining invoice, restaurant check, utility bill, online invoice/tax invoice, payment app transaction screenshot such as Google Pay/PhonePe/Paytm/CRED/BHIM, bank statement, or salary slip).
2. If this image is a PERSONAL PHOTO (portrait, selfie, person's face, group photo), a landscape, an animal, food without an actual bill, a room, an ID card, a vehicle, a random object, artwork, meme, or ANY photo that does NOT contain an actual transaction/bill/receipt with prices or payment confirmation:
   You MUST set "isValidFinancialDocument": false, "documentType": "NOT_A_FINANCIAL_DOCUMENT", and provide a helpful "reason": "This photo does not appear to be a receipt, bill, or payment confirmation. Please upload a clear photo of an invoice or receipt."
   Do NOT guess, fabricate, or hallucinate merchants, UPI payment methods, or verified paid statuses for personal photos or non-receipts!

If it IS a valid financial document ("isValidFinancialDocument": true), identify its nature:
1. STORE / RESTAURANT / RETAIL BILL: Grocery, dining, supermarket, shopping, pharmacy, e-commerce invoice with or without line items.
2. PAYMENT RECEIPT / CONFIRMATION: UPI app screenshot (GPay, PhonePe, Paytm, CRED), Card POS swipe slip, ATM withdrawal slip, bank NEFT/IMPS advice.
3. UTILITY / SERVICE INVOICE: Electricity, water, piped gas, broadband/wifi, mobile postpaid, DTH, rent, maintenance. Capture Due Date & Bill Status!
4. BANK STATEMENT: Multi-row debit/credit ledger across dates.
5. INCOME / SALARY SLIP: Payroll slip, dividend voucher, deposit confirmation, cashback credit.

Return ONLY a raw JSON object with NO markdown, NO backticks, and NO conversational text:
{
  "isValidFinancialDocument": <true if this is a genuine financial receipt/bill/payment confirmation, false otherwise>,
  "reason": <string explaining why if isValidFinancialDocument is false, otherwise null>,
  "documentType": "<'ITEMIZED_BILL' | 'SINGLE_EXPENSE' | 'UTILITY_BILL' | 'BANK_STATEMENT' | 'INCOME_SLIP' | 'NOT_A_FINANCIAL_DOCUMENT'>",
  "merchant": "<Clean Store, Biller, Merchant, Payee, or Beneficiary name, or null>",
  "totalAmount": <Grand total amount paid or due as a positive number, or 0>,
  "date": "<Transaction or bill date in YYYY-MM-DD format, or null>",
  "time": "<Time in HH:MM format if visible, otherwise null>",
  "paymentMethod": "<exactly one of: 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'NET_BANKING' | 'BANK_TRANSFER' | 'CASH' | 'OTHER' | null>",
  "category": "<exactly one of: 'Food & Dining' | 'Groceries' | 'Shopping' | 'Transport' | 'Bills & Utilities' | 'Entertainment' | 'Health' | 'Travel' | 'Investments' | 'Salary' | 'UPI Transfer' | 'Transfers' | 'Cashback & Rewards' | 'Interest & Dividends' | 'Refunds' | 'Education' | 'Other'>",
  "status": "<'PAID' for completed receipts/transactions, 'DUE' or 'UNPAID' for unpaid bills, or null>",
  "dueDate": "<YYYY-MM-DD if this is a bill with a due date, otherwise null>",
  "invoiceNumber": "<Invoice #, Bill #, Receipt #, Order ID, or Token # if visible, otherwise null>",
  "referenceId": "<UPI UTR (12 digits), Transaction ID, Bank Ref #, or Approval Code if visible, otherwise null>",
  "upiId": "<VPA address e.g. merchant@upi if visible, otherwise null>",
  "cardLast4": "<Masked card number or last 4 digits e.g. '4821' if visible, otherwise null>",
  "bankName": "<Bank name e.g. 'HDFC Bank', 'SBI', 'ICICI' if visible, otherwise null>",
  "consumerNumber": "<Consumer ID, CA Number, Account Number for utilities if visible, otherwise null>",
  "subtotal": <Amount before tax/discounts as number, or null>,
  "tax": <Total tax, GST, or VAT as number, or null>,
  "taxBreakup": {
    "cgst": <CGST number or null>,
    "sgst": <SGST number or null>,
    "igst": <IGST number or null>
  },
  "discount": <Discount, savings, or coupon amount as number, or null>,
  "serviceCharge": <Delivery fee, tip, or platform charge as number, or null>,
  "isItemized": <true if individual products/dishes/items are listed with quantities and prices, false otherwise>,
  "items": [
    {
      "name": "<Item description>",
      "quantity": <number, default 1>,
      "unitPrice": <price per unit as number, or null>,
      "price": <total price for this item as number>
    }
  ],
  "statementTransactions": [
    <Only populate if documentType is 'BANK_STATEMENT': list of { "date": "YYYY-MM-DD", "description": string, "amount": number, "type": "EXPENSE" | "INCOME", "category": string, "paymentMethod": string }>
  ],
  "note": "<A concise, high-value summary of payment details, or null>"
}`;

            try {
                const ai = getGeminiClient();
                const response = await ai.models.generateContent({
                    model: "gemini-2.5-flash",
                    contents: [
                        {
                            role: "user",
                            parts: [
                                { text: prompt },
                                {
                                    inlineData: {
                                        mimeType: input.mimeType,
                                        data: input.imageBase64,
                                    },
                                },
                            ],
                        },
                    ],
                    config: {
                        temperature: 0,
                        responseMimeType: "application/json",
                    },
                });

                const text = response.text || "{}";
                let parsed: any;
                try {
                    parsed = JSON.parse(text);
                } catch {
                    const jsonMatch = text.match(/\{[\s\S]*\}/);
                    if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
                    else throw new Error("Could not parse document data");
                }

                // If AI flags this as not a valid financial document (e.g. personal photo, selfie, random picture)
                if (parsed.isValidFinancialDocument === false || parsed.documentType === "NOT_A_FINANCIAL_DOCUMENT") {
                    return {
                        type: "error",
                        reason: parsed.reason || "This image does not appear to be a receipt, bill, or payment confirmation. Please upload a clear photo of an invoice or receipt.",
                    };
                }

                const totalAmount = Math.abs(parseFloat(parsed.totalAmount) || parseFloat(parsed.amount) || parseFloat(parsed.total) || 0);

                // Guardrail: If totalAmount is 0 and no line items or reference identifiers exist, reject as non-financial
                const hasLineItems = Array.isArray(parsed.items) && parsed.items.length > 0;
                const hasTxIdentifiers = Boolean(parsed.referenceId || parsed.invoiceNumber || parsed.upiId);
                const isStatementDoc = parsed.documentType === "BANK_STATEMENT" && Array.isArray(parsed.statementTransactions) && parsed.statementTransactions.length > 0;

                if (totalAmount <= 0 && !hasLineItems && !hasTxIdentifiers && !isStatementDoc) {
                    return {
                        type: "error",
                        reason: "No payment amount or transaction details were found in this image. Please upload a clear receipt or bill.",
                    };
                }

                const pm = sanitizePaymentMethod(parsed.paymentMethod);
                const category = sanitizeCategory(parsed.category);
                const note = formatPaymentNote({
                    invoiceNumber: parsed.invoiceNumber,
                    referenceId: parsed.referenceId,
                    upiId: parsed.upiId,
                    cardLast4: parsed.cardLast4,
                    bankName: parsed.bankName,
                    consumerNumber: parsed.consumerNumber,
                    subtotal: parsed.subtotal ? parseFloat(parsed.subtotal) : null,
                    tax: parsed.tax ? parseFloat(parsed.tax) : null,
                    discount: parsed.discount ? parseFloat(parsed.discount) : null,
                    dueDate: parsed.dueDate,
                    status: parsed.status,
                    existingNote: parsed.note,
                });

                // Check if this receipt or transaction already exists in user's ledger
                let existingDuplicate: any = null;
                const checkMerchant = (parsed.merchant || "").trim().toLowerCase();
                const checkRefId = (parsed.referenceId || "").trim();
                const checkInvNum = (parsed.invoiceNumber || "").trim();

                if (checkRefId && checkRefId.length >= 4) {
                    const snap = await ctx.db.collection("expenses")
                        .where("userId", "==", userId)
                        .where("referenceId", "==", checkRefId)
                        .limit(1)
                        .get();
                    if (!snap.empty) {
                        const d = snap.docs[0].data();
                        existingDuplicate = {
                            id: snap.docs[0].id,
                            merchant: d.merchant,
                            amount: d.amount,
                            date: d.date ? new Date(d.date).toISOString().split("T")[0] : null,
                            matchReason: `Reference ID (${checkRefId})`,
                        };
                    }
                }

                if (!existingDuplicate && checkInvNum && checkInvNum.length >= 3) {
                    const snap = await ctx.db.collection("expenses")
                        .where("userId", "==", userId)
                        .where("invoiceNumber", "==", checkInvNum)
                        .limit(1)
                        .get();
                    if (!snap.empty) {
                        const d = snap.docs[0].data();
                        existingDuplicate = {
                            id: snap.docs[0].id,
                            merchant: d.merchant,
                            amount: d.amount,
                            date: d.date ? new Date(d.date).toISOString().split("T")[0] : null,
                            matchReason: `Invoice #${checkInvNum}`,
                        };
                    }
                }

                if (!existingDuplicate && totalAmount > 0 && checkMerchant) {
                    const snap = await ctx.db.collection("expenses")
                        .where("userId", "==", userId)
                        .where("amount", "==", totalAmount)
                        .limit(10)
                        .get();
                    if (!snap.empty) {
                        const targetDateStr = parsed.date ? String(parsed.date).split("T")[0] : "";
                        for (const doc of snap.docs) {
                            const d = doc.data();
                            const expMerchant = (d.merchant || "").trim().toLowerCase();
                            const expDateStr = d.date ? new Date(d.date).toISOString().split("T")[0] : "";

                            if (expMerchant === checkMerchant || expMerchant.includes(checkMerchant) || checkMerchant.includes(expMerchant)) {
                                if (!targetDateStr || !expDateStr || targetDateStr === expDateStr) {
                                    existingDuplicate = {
                                        id: doc.id,
                                        merchant: d.merchant,
                                        amount: d.amount,
                                        date: expDateStr,
                                        matchReason: `${d.merchant} for ₹${totalAmount}`,
                                    };
                                    break;
                                }
                            }
                        }
                    }
                }

                // Multi-row Bank Statement
                if (parsed.documentType === "BANK_STATEMENT" && Array.isArray(parsed.statementTransactions) && parsed.statementTransactions.length > 1) {
                    const txs = parsed.statementTransactions;
                    const expSnap = await ctx.db.collection("expenses").where("userId", "==", userId).limit(500).get();
                    const existingExp = expSnap.docs.map((d: any) => d.data());
                    let duplicateCount = 0;
                    txs.forEach((t: any) => {
                        const tAmt = Math.abs(parseFloat(t.amount) || 0);
                        const tDesc = (t.description || "").toLowerCase().trim();
                        const tDate = t.date ? String(t.date).split("T")[0] : "";
                        const exists = existingExp.some((e: any) => {
                            if (Math.abs(Number(e.amount) - tAmt) > 0.05) return false;
                            const eDate = e.date ? new Date(e.date).toISOString().split("T")[0] : "";
                            const eDesc = (e.merchant || "").toLowerCase().trim();
                            if (tDate && eDate && tDate !== eDate) return false;
                            if (tDesc && eDesc) {
                                return tDesc.includes(eDesc) || eDesc.includes(tDesc) || tDesc.slice(0, 8) === eDesc.slice(0, 8);
                            }
                            return true;
                        });
                        if (exists) duplicateCount++;
                    });
                    const isDuplicateStatement = duplicateCount > 0 && (duplicateCount === txs.length || duplicateCount / txs.length >= 0.7);

                    return {
                        type: "statement",
                        bankName: parsed.merchant || "Bank Statement",
                        statementPeriod: parsed.date || "Recent",
                        totalTransactions: parsed.statementTransactions.length,
                        isDuplicateStatement,
                        duplicateCount,
                        totalExpenses: parsed.statementTransactions.filter((t: any) => t.type === "EXPENSE").reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0),
                        totalIncomes: parsed.statementTransactions.filter((t: any) => t.type === "INCOME").reduce((s: number, t: any) => s + (parseFloat(t.amount) || 0), 0),
                        transactions: parsed.statementTransactions.map((tx: any) => ({
                            date: tx.date || new Date().toISOString().split("T")[0],
                            description: tx.description || "Transaction",
                            amount: Math.abs(parseFloat(tx.amount) || 0),
                            type: tx.type === "INCOME" ? "INCOME" : "EXPENSE",
                            paymentMethod: sanitizePaymentMethod(tx.paymentMethod),
                            category: sanitizeCategory(tx.category),
                        })),
                    };
                }

                // Income Slip / Salary
                if (parsed.documentType === "INCOME_SLIP") {
                    return {
                        type: "income",
                        isDuplicate: Boolean(existingDuplicate),
                        duplicateInfo: existingDuplicate,
                        data: {
                            source: parsed.merchant || "Income Source",
                            amount: totalAmount,
                            date: parsed.date || new Date().toISOString().split("T")[0],
                            paymentMethod: pm,
                            referenceId: parsed.referenceId || null,
                            note,
                        },
                    };
                }

                // Itemized Bill (with individual items / dishes / products)
                if (parsed.isItemized && Array.isArray(parsed.items) && parsed.items.length > 0) {
                    const validItems = parsed.items.map((it: any) => ({
                        name: it.name || "Item",
                        quantity: Number(it.quantity) || 1,
                        price: Math.abs(parseFloat(it.price) || (parseFloat(it.unitPrice) * (Number(it.quantity) || 1)) || 0),
                        unitPrice: it.unitPrice ? Math.abs(parseFloat(it.unitPrice)) : null,
                    })).filter((it: any) => it.price > 0 || it.name !== "Item");

                    if (validItems.length > 0) {
                        return {
                            type: "bill",
                            isDuplicate: Boolean(existingDuplicate),
                            duplicateInfo: existingDuplicate,
                            merchant: parsed.merchant || "Store / Restaurant",
                            date: parsed.date || new Date().toISOString().split("T")[0],
                            time: parsed.time || null,
                            paymentMethod: pm,
                            category,
                            invoiceNumber: parsed.invoiceNumber || null,
                            referenceId: parsed.referenceId || null,
                            upiId: parsed.upiId || null,
                            cardLast4: parsed.cardLast4 || null,
                            bankName: parsed.bankName || null,
                            consumerNumber: parsed.consumerNumber || null,
                            subtotal: parsed.subtotal ? parseFloat(parsed.subtotal) : null,
                            tax: parsed.tax ? parseFloat(parsed.tax) : null,
                            taxBreakup: parsed.taxBreakup || null,
                            discount: parsed.discount ? parseFloat(parsed.discount) : null,
                            serviceCharge: parsed.serviceCharge ? parseFloat(parsed.serviceCharge) : null,
                            billStatus: parsed.status || "PAID",
                            dueDate: parsed.dueDate || null,
                            items: validItems,
                            total: totalAmount > 0 ? totalAmount : validItems.reduce((s: number, i: any) => s + i.price, 0),
                            note,
                        };
                    }
                }

                // Single Expense / Payment Receipt / Utility Bill
                return {
                    type: "expense",
                    isDuplicate: Boolean(existingDuplicate),
                    duplicateInfo: existingDuplicate,
                    data: {
                        merchant: parsed.merchant || "Merchant",
                        amount: totalAmount,
                        date: parsed.date || new Date().toISOString().split("T")[0],
                        time: parsed.time || null,
                        category,
                        paymentMethod: pm,
                        invoiceNumber: parsed.invoiceNumber || null,
                        referenceId: parsed.referenceId || null,
                        upiId: parsed.upiId || null,
                        cardLast4: parsed.cardLast4 || null,
                        bankName: parsed.bankName || null,
                        consumerNumber: parsed.consumerNumber || null,
                        subtotal: parsed.subtotal ? parseFloat(parsed.subtotal) : null,
                        tax: parsed.tax ? parseFloat(parsed.tax) : null,
                        taxBreakup: parsed.taxBreakup || null,
                        discount: parsed.discount ? parseFloat(parsed.discount) : null,
                        serviceCharge: parsed.serviceCharge ? parseFloat(parsed.serviceCharge) : null,
                        billStatus: parsed.status || "PAID",
                        dueDate: parsed.dueDate || null,
                        note,
                    },
                };
            } catch (error: any) {
                console.error("Gemini Scan Error:", error);
                throw new Error("Failed to process the document.");
            }
        }),

    suggestCategory: protectedProcedure
        .input(z.object({ merchant: z.string(), note: z.string().optional() }))
        .mutation(async ({ input }) => {
            const prompt = `Based on the merchant "${input.merchant}" and note "${input.note || ''}", suggest a category.
Valid categories are: Food & Dining, Transport, Shopping, Entertainment, Health, Bills & Utilities, Travel, Groceries, Education, Other.
Return ONLY a raw JSON object: {"category": "<valid_category_name>"}
Do not return any extra text.`;

            const ai = getGeminiClient();
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 0,
                    responseMimeType: "application/json",
                },
            });

            const text = response.text || "{}";
            try {
                const parsed = JSON.parse(text);
                return { category: parsed.category || "Other" };
            } catch {
                return { category: "Other" };
            }
        }),

    suggestIcon: protectedProcedure
        .input(z.object({ name: z.string() }))
        .mutation(async ({ input }) => {
            const prompt = `Based on the name "${input.name}", suggest a visual icon representing it.
Choose ONE from this exact list of Lucide React icon names:
utensils, car, shopping-bag, film, heart-pulse, zap, plane, shopping-cart, book-open, coffee, home, monitor, smartphone, wifi, droplet, flame, bus, train, shirt, gift, game-pad, music, scissors, brief-case
Return ONLY a raw JSON object: {"icon": "<icon_name>"}
Do not return any extra text.`;

            const ai = getGeminiClient();
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 0,
                    responseMimeType: "application/json",
                },
            });

            const text = response.text || "{}";
            try {
                const parsed = JSON.parse(text);
                return { icon: parsed.icon || "circle" };
            } catch {
                return { icon: "circle" };
            }
        }),

    getInsights: protectedProcedure.query(async ({ ctx }) => {
        const userId = ctx.session.user.id!;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        const [expensesSnap, budgetsSnap, categoriesSnap] = await Promise.all([
            ctx.db.collection("expenses").where("userId", "==", userId).where("date", ">=", startOfMonth).get(),
            ctx.db.collection("budgets").where("userId", "==", userId).get(),
            ctx.db.collection("categories").where("userId", "==", userId).get()
        ]);

        const categories = categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
        const expenses = expensesSnap.docs.map(d => {
            const data = d.data() as any;
            return {
                ...data,
                category: data.categoryId ? categories.find(c => c.id === data.categoryId) : null
            };
        });
        const budgets = budgetsSnap.docs.map(d => d.data() as any);

        if (expenses.length === 0) {
            return {
                score: 85,
                insights: [
                    "No expenses logged this month yet — great start!",
                    "Set up budgets to track your spending goals.",
                    "Add your first expense to get personalized insights.",
                ],
                tip: "Start by adding your daily expenses to build a spending profile.",
                topCategories: [],
                totalSpent: 0,
            };
        }

        const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalBudget = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);

        const categoryMap = new Map<string, number>();
        expenses.forEach((e) => {
            const cat = e.category?.name ?? "Other";
            categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + (e.amount || 0));
        });

        const topCategories = Array.from(categoryMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([name, amount]) => ({ name, amount }));

        const expenseSummary = topCategories
            .map(({ name, amount }) => `${name}: ₹${amount.toFixed(2)}`)
            .join(", ");

        const prompt = `You are a personal finance AI coach. Analyze this monthly spending data and provide insights:

Total spent: ₹${totalSpent.toFixed(2)}
Total budget: ${totalBudget > 0 ? `₹${totalBudget.toFixed(2)}` : "Not set"}
Budget utilization: ${totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : "N/A"}
Top spending categories: ${expenseSummary}
Number of transactions: ${expenses.length}

Return ONLY valid JSON (no markdown):
{
  "score": <number 0-100, financial health score>,
  "insights": [<string>, <string>, <string>],
  "tip": "<string, one actionable tip>"
}`;

        try {
            const ai = getGeminiClient();
            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: [{ role: "user", parts: [{ text: prompt }] }],
                config: {
                    temperature: 0,
                    responseMimeType: "application/json",
                },
            });
            const text = response.text || "{}";

            try {
                const parsed = JSON.parse(text);
                return { ...parsed, topCategories, totalSpent };
            } catch {
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    return { ...parsed, topCategories, totalSpent };
                }
                throw new Error("Failed to parse AI JSON");
            }
        } catch (error) {
            console.error("AI Insights Error:", error);
            return {
                score: 70,
                insights: [
                    "Experiencing high traffic right now.",
                    "Unable to analyze spending at this time.",
                    "Keep tracking your expenses!",
                ],
                tip: "Consistency in tracking leads to better financial health.",
                topCategories,
                totalSpent,
            };
        }
    }),

    chat: protectedProcedure
        .input(
            z.object({
                messages: z.array(z.object({
                    role: z.enum(["user", "assistant"]),
                    content: z.string()
                })),
                currency: z.string().optional()
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.session.user.id!;
            const currConfig = getCurrencyConfig(input.currency);

            // Fetch complete contextual data from Firestore (all user records)
            const [expensesSnap, incomesSnap, budgetsSnap, categoriesSnap] = await Promise.all([
                ctx.db.collection("expenses").where("userId", "==", userId).orderBy("date", "desc").get(),
                ctx.db.collection("incomes").where("userId", "==", userId).orderBy("date", "desc").get(),
                ctx.db.collection("budgets").where("userId", "==", userId).get(),
                ctx.db.collection("categories").where("userId", "==", userId).get()
            ]);

            const categories = categoriesSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));

            const expenses = expensesSnap.docs.map(d => {
                const data = d.data() as any;
                return {
                    ...data,
                    category: data.categoryId ? categories.find(c => c.id === data.categoryId) : null
                };
            });

            const incomes = incomesSnap.docs.map(d => {
                const data = d.data() as any;
                return {
                    ...data,
                    category: data.categoryId ? categories.find(c => c.id === data.categoryId) : null
                };
            });

            const budgets = budgetsSnap.docs.map(d => {
                const data = d.data() as any;
                return {
                    ...data,
                    category: data.categoryId ? categories.find(c => c.id === data.categoryId) : null
                };
            });

            const financialContext: FinancialContext = {
                expenses,
                incomes,
                budgets,
                categories,
                currency: currConfig.code,
            };

            const lastUserMessage = [...input.messages].reverse().find(m => m.role === "user")?.content || "";
            const detectedAction = parseTransactionIntent(lastUserMessage);

            // If user intent was to add a transaction, prepare the action confirmation
            if (detectedAction) {
                const formattedActionAmt = formatCurrency(detectedAction.amount, false, currConfig.code);
                return {
                    message: `I've prepared the ${detectedAction.type} for **${detectedAction.merchant}** of **${formattedActionAmt}**. Tap below to confirm and add it to your records!`,
                    action: detectedAction,
                    citations: [] as RAGCitation[],
                };
            }

            // Run RAG retrieval across all user transactions
            const ragResult = retrieveFinancialContext(lastUserMessage, financialContext);

            // If Gemini is available, attempt generative AI with grounded RAG context
            if (process.env.GEMINI_API_KEY) {
                try {
                    const richContext = buildRichPromptContext(financialContext);
                    const systemInstruction = `You are Agent Floww, an intelligent personal finance assistant for the Floww app.
Use the detailed financial records and referenced transactions below to answer user queries with precise numbers, transaction dates, and merchant/source names.
Be direct, helpful, and concise. Format all currency amounts in ${currConfig.name} (${currConfig.symbol}) (e.g. ${currConfig.symbol}1,250.00).

${ragResult.ragPrompt}

${richContext}`;

                    const formattedMessages = input.messages.map(m => ({
                        role: m.role === "assistant" ? "model" : "user",
                        parts: [{ text: m.content }]
                    }));

                    const ai = getGeminiClient();
                    const response = await ai.models.generateContent({
                        model: "gemini-2.5-flash",
                        contents: formattedMessages,
                        config: {
                            systemInstruction: { parts: [{ text: systemInstruction }] },
                            temperature: 0.3,
                            maxOutputTokens: 500,
                        }
                    });

                    if (response.text && response.text.trim().length > 0) {
                        return {
                            message: response.text,
                            citations: ragResult.citations,
                        };
                    }
                } catch (error) {
                    console.error("Gemini Chat Error, falling back to deterministic engine:", error);
                }
            }

            // High-accuracy offline financial query answering engine with RAG support
            const offlineAnswer = answerFinancialQuery(lastUserMessage, financialContext);
            return {
                message: offlineAnswer || ragResult.directAnswer || "I'm your personal financial assistant. You can ask me questions about your highest income, biggest expenses, category spending, or recent transactions!",
                citations: ragResult.citations,
            };
        }),
});
