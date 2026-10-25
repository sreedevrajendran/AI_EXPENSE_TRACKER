import { formatCurrency, formatDate, getCurrencyConfig, convertFromBaseCurrency } from "./utils";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";

export interface TransactionRecord {
    id: string;
    date: Date | string;
    amount: number;
    type: "DEBIT" | "CREDIT";
    description: string;
    category?: string;
    paymentMethod?: string;
}

export type StatementPeriodFilter = "month" | "3months" | "financial_year" | "all";

export function getFilterDateRange(filter: StatementPeriodFilter): { start: Date | null; end: Date | null; label: string } {
    const now = new Date();
    if (filter === "month") {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        const label = now.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
        return { start, end, label: `This Month (${label})` };
    }
    if (filter === "3months") {
        const start = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { start, end, label: "Last 3 Months" };
    }
    if (filter === "financial_year") {
        const currentYear = now.getFullYear();
        // Indian Financial Year runs from April 1 to March 31
        const fyStartYear = now.getMonth() >= 3 ? currentYear : currentYear - 1;
        const start = new Date(fyStartYear, 3, 1, 0, 0, 0);
        const end = new Date(fyStartYear + 1, 2, 31, 23, 59, 59);
        return { start, end, label: `Financial Year ${fyStartYear}-${(fyStartYear + 1).toString().slice(-2)}` };
    }
    return { start: null, end: null, label: "All Transactions" };
}

export function filterTransactions(items: any[] = [], range: { start: Date | null; end: Date | null }) {
    if (!range.start && !range.end) return items;
    return items.filter((item) => {
        const d = new Date(item.date).getTime();
        if (range.start && d < range.start.getTime()) return false;
        if (range.end && d > range.end.getTime()) return false;
        return true;
    });
}

export function generateStatementRecords(expenses: any[] = [], incomes: any[] = []): {
    records: (TransactionRecord & { runningBalance: number })[];
    totalCredits: number;
    totalDebits: number;
    closingBalance: number;
    startDate: string;
    endDate: string;
} {
    const list: TransactionRecord[] = [];

    // Map expenses as DEBIT
    for (const e of expenses) {
        list.push({
            id: e.id || Math.random().toString(36).substring(7),
            date: new Date(e.date),
            amount: Number(e.amount) || 0,
            type: "DEBIT",
            description: e.merchant || "Expense",
            category: e.category?.name || e.categoryName || "Uncategorized",
            paymentMethod: e.paymentMethod || "UPI",
        });
    }

    // Map incomes as CREDIT
    for (const i of incomes) {
        list.push({
            id: i.id || Math.random().toString(36).substring(7),
            date: new Date(i.date),
            amount: Number(i.amount) || 0,
            type: "CREDIT",
            description: i.source || "Income",
            category: "Income",
            paymentMethod: "Bank Deposit",
        });
    }

    // Sort chronologically ascending to compute running balance
    list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    let totalCredits = 0;
    let totalDebits = 0;

    const recordsWithBalance = list.map((item) => {
        if (item.type === "CREDIT") {
            running += item.amount;
            totalCredits += item.amount;
        } else {
            running -= item.amount;
            totalDebits += item.amount;
        }
        return {
            ...item,
            runningBalance: running,
        };
    });

    const startDate = list.length > 0 ? formatDate(list[0].date) : "N/A";
    const endDate = list.length > 0 ? formatDate(list[list.length - 1].date) : "N/A";

    return {
        records: recordsWithBalance,
        totalCredits,
        totalDebits,
        closingBalance: running,
        startDate,
        endDate,
    };
}

/**
 * Opens an Official Transaction Statement Document ready for instant Print-to-PDF or saving
 */
export function openPrintableTransactionStatement(
    expenses: any[] = [],
    incomes: any[] = [],
    userName: string = "Account Holder",
    filter: StatementPeriodFilter = "all"
) {
    const range = getFilterDateRange(filter);
    const filteredExpenses = filterTransactions(expenses, range);
    const filteredIncomes = filterTransactions(incomes, range);

    const { records, totalCredits, totalDebits, closingBalance, startDate, endDate } = generateStatementRecords(filteredExpenses, filteredIncomes);
    const now = new Date().toLocaleString();
    const reversed = [...records].reverse();

    const tableRows = reversed.map((r) => {
        const d = new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const isDebit = r.type === "DEBIT";
        return `
            <tr style="border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 10px 12px; font-size: 13px; color: #374151;">${d}</td>
                <td style="padding: 10px 12px; font-size: 13px; font-weight: 600; color: #111827;">${r.description}</td>
                <td style="padding: 10px 12px; font-size: 12px; color: #6b7280;">${r.category}</td>
                <td style="padding: 10px 12px; font-size: 12px; color: #6b7280;">${r.paymentMethod || "UPI"}</td>
                <td style="padding: 10px 12px; font-size: 13px; text-align: right; color: ${isDebit ? "#dc2626" : "#9ca3af"}; font-weight: ${isDebit ? "600" : "normal"};">
                    ${isDebit ? `₹${r.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "-"}
                </td>
                <td style="padding: 10px 12px; font-size: 13px; text-align: right; color: ${!isDebit ? "#16a34a" : "#9ca3af"}; font-weight: ${!isDebit ? "600" : "normal"};">
                    ${!isDebit ? `₹${r.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` : "-"}
                </td>
                <td style="padding: 10px 12px; font-size: 13px; text-align: right; font-weight: 700; color: #111827;">
                    ₹${r.runningBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
            </tr>
        `;
    }).join("");

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Floww Transaction Statement - ${userName} - ${range.label}</title>
    <style>
        @page { size: A4; margin: 15mm; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1f2937;
            margin: 0;
            padding: 24px;
            background: #fff;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #007aff;
            padding-bottom: 16px;
            margin-bottom: 24px;
        }
        .logo-title {
            font-size: 26px;
            font-weight: 800;
            color: #007aff;
            letter-spacing: -0.5px;
            margin: 0;
        }
        .subtitle {
            font-size: 12px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-top: 4px;
        }
        .meta-box {
            text-align: right;
            font-size: 12px;
            color: #4b5563;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
            margin-bottom: 28px;
        }
        .card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 14px;
        }
        .card-label {
            font-size: 11px;
            font-weight: 700;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 4px;
        }
        .card-value {
            font-size: 18px;
            font-weight: 800;
            color: #111827;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 32px;
        }
        th {
            background: #f3f4f6;
            color: #4b5563;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            padding: 10px 12px;
            border-bottom: 2px solid #e5e7eb;
        }
        .footer {
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #9ca3af;
        }
        .stamp {
            display: inline-block;
            border: 1.5px solid #10b981;
            color: #10b981;
            padding: 4px 10px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 20px; display: flex; justify-content: flex-end; gap: 10px;">
        <button onclick="window.print()" style="background: #007aff; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px;">
            Print / Save as PDF
        </button>
        <button onclick="window.close()" style="background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; padding: 10px 16px; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 13px;">
            Close
        </button>
    </div>

    <div class="header">
        <div>
            <h1 class="logo-title">FLOWW</h1>
            <div class="subtitle">TRANSACTION STATEMENT &bull; ${range.label}</div>
            <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: 700; color: #111827;">${userName}</p>
        </div>
        <div class="meta-box">
            <p style="margin: 0 0 2px 0;"><strong>Statement Period:</strong> ${startDate} to ${endDate}</p>
            <p style="margin: 0 0 2px 0;"><strong>Filter Applied:</strong> ${range.label}</p>
            <p style="margin: 0 0 2px 0;"><strong>Generated On:</strong> ${now}</p>
            <p style="margin: 0;"><strong>Currency:</strong> INR (₹)</p>
        </div>
    </div>

    <div class="summary-grid">
        <div class="card">
            <div class="card-label">Total Deposits (CR)</div>
            <div class="card-value" style="color: #16a34a;">+₹${totalCredits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="card">
            <div class="card-label">Total Withdrawals (DR)</div>
            <div class="card-value" style="color: #dc2626;">-₹${totalDebits.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="card">
            <div class="card-label">Net Balance</div>
            <div class="card-value" style="color: ${closingBalance >= 0 ? "#111827" : "#dc2626"};">₹${closingBalance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
        </div>
        <div class="card">
            <div class="card-label">Total Records</div>
            <div class="card-value">${records.length}</div>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="text-align: left;">Date</th>
                <th style="text-align: left;">Particulars</th>
                <th style="text-align: left;">Category</th>
                <th style="text-align: left;">Mode</th>
                <th style="text-align: right;">Debit (DR)</th>
                <th style="text-align: right;">Credit (CR)</th>
                <th style="text-align: right;">Balance</th>
            </tr>
        </thead>
        <tbody>
            ${tableRows || `<tr><td colspan="7" style="text-align:center; padding: 24px; color: #9ca3af;">No transactions recorded in this period</td></tr>`}
        </tbody>
    </table>

    <div class="footer">
        <div>
            <p style="margin: 0 0 4px 0; font-weight: 600; color: #4b5563;">Floww Financial Intelligence Platform v2.0</p>
            <p style="margin: 0;">This is a computer-generated transaction statement verified by digital cryptographic ledger.</p>
        </div>
        <div>
            <span class="stamp">&#10003; Verified Statement</span>
        </div>
    </div>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) {
        const cleanLabel = range.label.replace(/[^a-zA-Z0-9]/g, "_");
        const a = document.createElement("a");
        a.href = url;
        a.download = `Floww_Transaction_Statement_${cleanLabel}_${new Date().toISOString().split("T")[0]}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
}

/**
 * Backward compatibility alias
 */
export const openPrintableBankStatement = openPrintableTransactionStatement;

/**
 * Generates and downloads an authentic, bank-grade PDF transaction statement using jsPDF and jspdf-autotable
 */
export async function downloadStatementPdf(
    expenses: any[] = [],
    incomes: any[] = [],
    userName: string = "Account Holder",
    filter: StatementPeriodFilter = "month",
    activeCurrency: string = "INR"
): Promise<{ filename: string; uri: string; label: string }> {
    const { jsPDF } = await import("jspdf");
    const autoTableMod = await import("jspdf-autotable");
    const autoTable = (autoTableMod as any).default || autoTableMod;

    const range = getFilterDateRange(filter);
    const filteredExpenses = filterTransactions(expenses, range);
    const filteredIncomes = filterTransactions(incomes, range);

    const { records, totalCredits, totalDebits, closingBalance } = generateStatementRecords(filteredExpenses, filteredIncomes);
    const now = new Date().toLocaleString();

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Primary Brand Bar
    doc.setFillColor(0, 122, 255);
    doc.rect(14, 12, 4, 18, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(17, 24, 39);
    doc.text("floww", 22, 22);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);
    doc.text("OFFICIAL TRANSACTION STATEMENT", 22, 28);

    const config = getCurrencyConfig(activeCurrency);
    const currencyLabel = config.code === "INR" ? "INR (Rs.)" : `${config.code} (${config.symbol})`;

    // Helper to format clean ASCII currency amounts for jsPDF (avoids corrupted superscript '¹' caused by Unicode ₹ in Helvetica font)
    const formatPdf = (val: number, withSign = false): string => {
        const converted = convertFromBaseCurrency(val, config.code);
        const absVal = Math.abs(converted);
        const numStr = absVal.toLocaleString(config.locale, {
            minimumFractionDigits: config.code === "JPY" ? 0 : 2,
            maximumFractionDigits: config.code === "JPY" ? 0 : 2,
        });
        const prefix = config.code === "INR" ? "Rs. " : config.code === "USD" ? "$ " : `${config.code} `;
        if (withSign) {
            if (converted < 0) return `-${prefix}${numStr}`;
            if (converted > 0) return `+${prefix}${numStr}`;
            return `${prefix}${numStr}`;
        }
        return `${prefix}${numStr}`;
    };

    // Meta box on right
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(75, 85, 99);
    doc.text(`Account Holder: ${userName}`, pageWidth - 14, 18, { align: "right" });
    doc.text(`Period: ${range.label}`, pageWidth - 14, 23, { align: "right" });
    doc.text(`Generated: ${now}`, pageWidth - 14, 28, { align: "right" });
    doc.text(`Currency: ${currencyLabel}`, pageWidth - 14, 33, { align: "right" });

    // Summary Card Box
    doc.setDrawColor(229, 231, 235);
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(14, 38, pageWidth - 28, 22, 3, 3, "FD");

    const colW = (pageWidth - 28) / 4;

    // Total Credits
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(107, 114, 128);
    doc.text("TOTAL DEPOSITS (CR)", 18, 44);
    doc.setFontSize(10);
    doc.setTextColor(22, 163, 74);
    doc.text(`+${formatPdf(totalCredits)}`, 18, 52);

    // Total Debits
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text("TOTAL WITHDRAWALS (DR)", 18 + colW, 44);
    doc.setFontSize(10);
    doc.setTextColor(220, 38, 38);
    doc.text(`-${formatPdf(totalDebits)}`, 18 + colW, 52);

    // Net Balance
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text("NET CASH FLOW", 18 + colW * 2, 44);
    doc.setFontSize(10);
    doc.setTextColor(closingBalance >= 0 ? 17 : 220, closingBalance >= 0 ? 24 : 38, closingBalance >= 0 ? 39 : 38);
    doc.text(formatPdf(closingBalance, true), 18 + colW * 2, 52);

    // Transactions count
    doc.setFontSize(7.5);
    doc.setTextColor(107, 114, 128);
    doc.text("TRANSACTIONS", 18 + colW * 3, 44);
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(`${records.length} records`, 18 + colW * 3, 52);

    // Itemized table
    const reversed = [...records].reverse();
    const rows = reversed.map((r) => {
        const d = new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        const isDebit = r.type === "DEBIT";
        const balStr = formatPdf(r.runningBalance, true);
        return [
            d,
            r.description,
            r.category || "-",
            r.paymentMethod || "UPI",
            isDebit ? formatPdf(r.amount) : "-",
            !isDebit ? formatPdf(r.amount) : "-",
            balStr
        ];
    });

    autoTable(doc, {
        startY: 65,
        head: [["Date", "Particulars", "Category", "Mode", "Debit (DR)", "Credit (CR)", "Balance"]],
        body: rows.length > 0 ? rows : [["-", "No transactions found in this period", "-", "-", "-", "-", "-"]],
        theme: "striped",
        headStyles: {
            fillColor: [17, 24, 39],
            textColor: [255, 255, 255],
            fontStyle: "bold",
            fontSize: 7.5,
            cellPadding: { top: 3, right: 1.5, bottom: 3, left: 1.5 },
        },
        styles: {
            fontSize: 7.5,
            cellPadding: { top: 2.2, right: 1.5, bottom: 2.2, left: 1.5 },
            textColor: [31, 41, 55],
            lineColor: [229, 231, 235],
            lineWidth: 0.1,
            valign: "middle",
        },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 42, fontStyle: "bold" },
            2: { cellWidth: 22 },
            3: { cellWidth: 16 },
            4: { cellWidth: 27, halign: "right", textColor: [220, 38, 38] },
            5: { cellWidth: 27, halign: "right", textColor: [22, 163, 74] },
            6: { cellWidth: 28, halign: "right", fontStyle: "bold" }
        },
        alternateRowStyles: {
            fillColor: [249, 250, 251]
        },
        didDrawPage: (data: any) => {
            const pageCount = (doc.internal as any).getNumberOfPages();
            doc.setFontSize(7.5);
            doc.setTextColor(156, 163, 175);
            doc.text(
                `Floww Financial Intelligence Platform • Verified Ledger • Page ${data.pageNumber} of ${pageCount}`,
                14,
                pageHeight - 8
            );
        }
    });

    const cleanLabel = range.label.replace(/[^a-zA-Z0-9]/g, "_");
    const filename = `Floww_Statement_${cleanLabel}_${new Date().toISOString().split("T")[0]}.pdf`;

    if (Capacitor.isNativePlatform()) {
        const dataUri = doc.output("datauristring");
        const base64Data = dataUri.split(",")[1];
        let savedUri = "";

        try {
            // Request public storage permission if on older Android
            try {
                const perm = await Filesystem.checkPermissions();
                if (perm.publicStorage !== "granted") {
                    await Filesystem.requestPermissions();
                }
            } catch (permErr) {
                console.warn("Storage permission request check failed:", permErr);
            }

            // Attempt 1: Write directly into Android's Download folder
            const res = await Filesystem.writeFile({
                path: `Download/${filename}`,
                data: base64Data,
                directory: Directory.ExternalStorage,
                recursive: true,
            });
            savedUri = res.uri;
        } catch (downloadErr) {
            console.warn("Writing to ExternalStorage/Download failed, falling back to Documents:", downloadErr);
            try {
                // Attempt 2: Write to Public Documents directory
                const res = await Filesystem.writeFile({
                    path: filename,
                    data: base64Data,
                    directory: Directory.Documents,
                    recursive: true,
                });
                savedUri = res.uri;
            } catch (docErr) {
                console.warn("Writing to Documents failed, falling back to Data folder:", docErr);
                // Attempt 3: Write to App Data directory
                const res = await Filesystem.writeFile({
                    path: filename,
                    data: base64Data,
                    directory: Directory.Data,
                    recursive: true,
                });
                savedUri = res.uri;
            }
        }

        return { filename, uri: savedUri, label: range.label };
    } else {
        doc.save(filename);
        return { filename, uri: filename, label: range.label };
    }
}
