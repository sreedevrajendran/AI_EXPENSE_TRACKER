/**
 * Canonical Financial Categories Configuration & Normalization Engine
 * 
 * Provides unified category definitions, icons, colors, and robust normalization
 * for handling spelling variations, singular/plural differences (e.g., Grocery vs Groceries),
 * and merchant/activity synonyms (e.g., Uber/Fuel -> Transport, Blinkit/Supermarket -> Groceries).
 */

export const DEFAULT_CATEGORY_METAS: Record<string, { icon: string; color: string }> = {
    "Food & Dining": { icon: "utensils", color: "#FF9F0A" },
    "Groceries": { icon: "shopping-cart", color: "#30D158" },
    "Transport": { icon: "car", color: "#007AFF" },
    "Shopping": { icon: "shopping-bag", color: "#FF2D55" },
    "Bills & Utilities": { icon: "zap", color: "#FF6B00" },
    "Entertainment": { icon: "film", color: "#5856D6" },
    "Health": { icon: "heart-pulse", color: "#34C759" },
    "Travel": { icon: "plane", color: "#5AC8FA" },
    "Investments": { icon: "bar-chart-2", color: "#AF52DE" },
    "Salary": { icon: "briefcase", color: "#30D158" },
    "UPI Transfer": { icon: "arrow-left-right", color: "#5E5CE6" },
    "Transfers": { icon: "repeat", color: "#0A84FF" },
    "Cashback & Rewards": { icon: "gift", color: "#FFD60A" },
    "Interest & Dividends": { icon: "trending-up", color: "#34C759" },
    "Refunds": { icon: "rotate-ccw", color: "#64D2FF" },
    "Education": { icon: "book-open", color: "#BF5AF2" },
    "Other": { icon: "circle", color: "#8E8E93" },
};

export const VALID_CATEGORIES = Object.keys(DEFAULT_CATEGORY_METAS) as readonly string[];

/**
 * Normalizes any category string, keyword, or narration into a canonical category name.
 * Robustly addresses common mismatches:
 * - "grocery" / "groceries" / "supermarket" / "kirana" / "blinkit" / "zepto" -> "Groceries"
 * - "transport" / "transportation" / "cab" / "uber" / "ola" / "fuel" / "petrol" / "metro" -> "Transport"
 */
export function normalizeCategoryName(raw?: string | null): string {
    if (!raw || typeof raw !== "string") return "Other";
    const clean = raw.trim();
    if (!clean) return "Other";
    const lower = clean.toLowerCase();

    // 1. Exact case-insensitive match
    const exact = VALID_CATEGORIES.find(c => c.toLowerCase() === lower);
    if (exact) return exact;

    // 2. Groceries: includes singular/plural, daily essentials, supermarkets, quick-commerce
    if (
        lower === "groceries" ||
        lower === "grocery" ||
        lower.startsWith("grocer") ||
        lower.includes("supermarket") ||
        lower.includes("super market") ||
        lower.includes("hypermarket") ||
        lower.includes("kirana") ||
        lower.includes("vegetable") ||
        lower.includes("veggie") ||
        lower.includes("fruit") ||
        lower.includes("provision") ||
        lower.includes("blinkit") ||
        lower.includes("zepto") ||
        lower.includes("instamart") ||
        lower.includes("bigbasket") ||
        lower.includes("dmart") ||
        lower.includes("d-mart") ||
        lower.includes("dairy") ||
        lower.includes("milk") ||
        lower.includes("ration") ||
        lower.includes("bazaar") ||
        lower.includes("convenience") ||
        lower.includes("country delight") ||
        lower.includes("otpy") ||
        lower.includes("foodmart") ||
        lower.includes("licious") ||
        lower.includes("freshtohome") ||
        lower.includes("more retail") ||
        lower.includes("reliance fresh") ||
        lower.includes("nature's basket")
    ) {
        return "Groceries";
    }

    // 3. Transport: includes cabs, rides, transit, fuels, tolls, parking, flights & trains
    if (
        lower === "transport" ||
        lower === "transportation" ||
        lower.includes("transit") ||
        lower.includes("commute") ||
        lower.includes("fuel") ||
        lower.includes("petrol") ||
        lower.includes("diesel") ||
        lower.includes("cng") ||
        lower.includes("uber") ||
        lower.includes("ola") ||
        lower.includes("rapido") ||
        lower.includes("taxi") ||
        lower.includes("cab") ||
        lower.includes("auto") ||
        lower.includes("rickshaw") ||
        lower.includes("metro") ||
        lower.includes("subway") ||
        lower.includes("train") ||
        lower.includes("railway") ||
        lower.includes("irctc") ||
        lower.includes("bus") ||
        lower.includes("ksrtc") ||
        lower.includes("redbus") ||
        lower.includes("abhibus") ||
        lower.includes("chalo") ||
        lower.includes("toll") ||
        lower.includes("fastag") ||
        lower.includes("parking") ||
        lower.includes("hpcl") ||
        lower.includes("bpcl") ||
        lower.includes("iocl") ||
        lower.includes("indian oil") ||
        lower.includes("shell petrol") ||
        lower.includes("nayara") ||
        lower.includes("zoomcar") ||
        lower.includes("driver") ||
        lower.includes("fare")
    ) {
        return "Transport";
    }

    // 4. Food & Dining: restaurants, food delivery, cafes, bakeries
    if (
        lower.includes("food") ||
        lower.includes("dining") ||
        lower.includes("restaurant") ||
        lower.includes("swiggy") ||
        lower.includes("zomato") ||
        lower.includes("cafe") ||
        lower.includes("coffee") ||
        lower.includes("bakery") ||
        lower.includes("pizza") ||
        lower.includes("burger") ||
        lower.includes("biryani") ||
        lower.includes("kitchen") ||
        lower.includes("dhaba") ||
        lower.includes("eatery") ||
        lower.includes("mcdonald") ||
        lower.includes("kfc") ||
        lower.includes("domino") ||
        lower.includes("subway") ||
        lower.includes("starbucks")
    ) {
        return "Food & Dining";
    }

    // 5. Bills & Utilities: electricity, water, telecom, maintenance, rent
    if (
        lower.includes("bill") ||
        lower.includes("utility") ||
        lower.includes("utilities") ||
        lower.includes("electricity") ||
        lower.includes("bescom") ||
        lower.includes("water") ||
        lower.includes("wifi") ||
        lower.includes("internet") ||
        lower.includes("broadband") ||
        lower.includes("recharge") ||
        lower.includes("airtel") ||
        lower.includes("jio") ||
        lower.includes("dth") ||
        lower.includes("rent") ||
        lower.includes("postpaid") ||
        lower.includes("piped gas") ||
        lower.includes("cylinder")
    ) {
        return "Bills & Utilities";
    }

    // 6. Shopping: e-commerce, clothing, retail stores, electronics
    if (
        lower.includes("shopping") ||
        lower.includes("amazon") ||
        lower.includes("flipkart") ||
        lower.includes("myntra") ||
        lower.includes("clothes") ||
        lower.includes("clothing") ||
        lower.includes("apparel") ||
        lower.includes("shoes") ||
        lower.includes("electronics") ||
        lower.includes("mall") ||
        lower.includes("zara") ||
        lower.includes("h&m") ||
        lower.includes("meesho") ||
        lower.includes("nykaa") ||
        lower.includes("croma")
    ) {
        return "Shopping";
    }

    // 7. Health: clinics, doctors, pharmacy, medicine, fitness
    if (
        lower.includes("health") ||
        lower.includes("medical") ||
        lower.includes("medicine") ||
        lower.includes("pharmacy") ||
        lower.includes("hospital") ||
        lower.includes("clinic") ||
        lower.includes("doctor") ||
        lower.includes("gym") ||
        lower.includes("fitness") ||
        lower.includes("apollo") ||
        lower.includes("1mg") ||
        lower.includes("pharmeasy") ||
        lower.includes("medplus")
    ) {
        return "Health";
    }

    // 8. Entertainment: streaming, cinema, gaming
    if (
        lower.includes("entertainment") ||
        lower.includes("movie") ||
        lower.includes("cinema") ||
        lower.includes("theatre") ||
        lower.includes("netflix") ||
        lower.includes("spotify") ||
        lower.includes("prime") ||
        lower.includes("hotstar") ||
        lower.includes("game") ||
        lower.includes("gaming") ||
        lower.includes("bookmyshow") ||
        lower.includes("pvr") ||
        lower.includes("inox") ||
        lower.includes("steam") ||
        lower.includes("playstation")
    ) {
        return "Entertainment";
    }

    // 9. Travel: hotels, flights, holidays, stays
    if (
        lower === "travel" ||
        lower.includes("hotel") ||
        lower.includes("resort") ||
        lower.includes("airbnb") ||
        lower.includes("vacation") ||
        lower.includes("trip") ||
        lower.includes("holiday") ||
        lower.includes("makemytrip") ||
        lower.includes("agoda") ||
        lower.includes("booking.com")
    ) {
        return "Travel";
    }

    // 10. Salary
    if (
        lower.includes("salary") ||
        lower.includes("payroll") ||
        lower.includes("stipend") ||
        lower.includes("wages") ||
        lower.includes("remuneration")
    ) {
        return "Salary";
    }

    // 11. Investments
    if (
        lower.includes("investment") ||
        lower.includes("mutual fund") ||
        lower.includes("stock") ||
        lower.includes("share") ||
        lower.includes("trading") ||
        lower.includes("zerodha") ||
        lower.includes("groww") ||
        lower.includes("angel one") ||
        lower.includes("sip")
    ) {
        return "Investments";
    }

    // 12. Cashback & Rewards
    if (lower.includes("cashback") || lower.includes("reward") || lower.includes("bonus")) {
        return "Cashback & Rewards";
    }

    // 13. Interest & Dividends
    if (lower.includes("interest") || lower.includes("dividend") || lower.includes("int.pd") || lower.includes("int pd")) {
        return "Interest & Dividends";
    }

    // 14. Refunds
    if (lower.includes("refund") || lower.includes("reversal") || lower.includes("reversed")) {
        return "Refunds";
    }

    // 15. Education
    if (lower.includes("education") || lower.includes("tuition") || lower.includes("school") || lower.includes("college") || lower.includes("course") || lower.includes("exam")) {
        return "Education";
    }

    // 16. Self / Account Transfers
    if (lower.includes("self transfer") || lower.includes("internal transfer") || lower.includes("account transfer")) {
        return "Transfers";
    }

    // 17. UPI Transfers
    if (lower.includes("upi transfer") || lower.includes("upi/")) {
        return "UPI Transfer";
    }

    return "Other";
}

/**
 * Searches a list of user categories to find a matching category by ID or name,
 * applying normalization (e.g., "Grocery" finds "Groceries", "cab" finds "Transport").
 */
export function findMatchingCategory<T extends { id: string; name: string }>(
    nameOrKeyword: string | undefined | null,
    categories: T[]
): T | null {
    if (!nameOrKeyword || !categories || categories.length === 0) return null;
    const clean = nameOrKeyword.trim().toLowerCase();

    // 1. Direct ID match
    const byId = categories.find(c => c.id === nameOrKeyword);
    if (byId) return byId;

    // 2. Exact name match
    const exact = categories.find(c => c.name.toLowerCase().trim() === clean);
    if (exact) return exact;

    // 3. Normalized canonical match (e.g. "Grocery" -> "Groceries")
    const canonical = normalizeCategoryName(nameOrKeyword);
    if (canonical && canonical !== "Other") {
        const matchCanonical = categories.find(c => c.name.toLowerCase().trim() === canonical.toLowerCase());
        if (matchCanonical) return matchCanonical;
    }

    // 4. Substring bidirectional match
    const partial = categories.find(c => {
        const cName = c.name.toLowerCase().trim();
        return clean.includes(cName) || cName.includes(clean);
    });
    if (partial) return partial;

    return null;
}
