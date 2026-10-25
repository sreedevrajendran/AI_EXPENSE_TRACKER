import fs from "fs";
import path from "path";

// In-memory & Disk-backed Mock Firestore for offline / local guest mode

interface StoredDoc {
    id: string;
    [key: string]: any;
}

const GUEST_USER_ID = "guest-user";
const DB_FILE_PATH = path.join(process.cwd(), ".data", "mock-db.json");

type StoreData = Record<string, Map<string, StoredDoc>>;

function saveToDiskSync(store: StoreData) {
    try {
        const dir = path.dirname(DB_FILE_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const serializable: Record<string, Record<string, StoredDoc>> = {};
        for (const [col, map] of Object.entries(store)) {
            serializable[col] = Object.fromEntries(map.entries());
        }
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(serializable, null, 2), "utf-8");
    } catch (e) {
        console.error("Failed to persist mockDb to disk:", e);
    }
}

let saveTimer: NodeJS.Timeout | null = null;
function scheduleSave(store: StoreData) {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
        saveToDiskSync(store);
    }, 150);
}

function loadFromDisk(): StoreData | null {
    try {
        if (fs.existsSync(DB_FILE_PATH)) {
            const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
            const parsed = JSON.parse(raw);
            const store: StoreData = {
                expenses: new Map(),
                incomes: new Map(),
                categories: new Map(),
                budgets: new Map(),
            };
            for (const [col, docs] of Object.entries(parsed)) {
                store[col] = new Map(Object.entries(docs as Record<string, StoredDoc>));
            }
            return store;
        }
    } catch (e) {
        console.error("Failed to load mockDb from disk:", e);
    }
    return null;
}

function cleanupDummySeedData(store: StoreData) {
    if (store.expenses && store.expenses.size > 2) {
        store.expenses.delete("exp-1");
        store.expenses.delete("exp-2");
    }
    if (store.incomes && store.incomes.size > 1) {
        store.incomes.delete("inc-1");
    }
}

function initStore(): StoreData {
    let store: StoreData;
    if ((globalThis as any).__mockDbStore) {
        store = (globalThis as any).__mockDbStore;
        cleanupDummySeedData(store);
        return store;
    }

    const loaded = loadFromDisk();
    if (loaded && (loaded.categories?.size > 0 || loaded.expenses?.size > 0 || loaded.incomes?.size > 0)) {
        cleanupDummySeedData(loaded);
        (globalThis as any).__mockDbStore = loaded;
        return loaded;
    }

    store = {
        expenses: new Map(),
        incomes: new Map(),
        categories: new Map(),
        budgets: new Map(),
    };

    const defaultCategories = [
        { id: "cat-1", name: "Food & Dining", icon: "utensils", color: "#FF9F0A", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-2", name: "Transport", icon: "car", color: "#007AFF", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-3", name: "Shopping", icon: "shopping-bag", color: "#FF2D55", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-4", name: "Entertainment", icon: "film", color: "#5856D6", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-5", name: "Health", icon: "heart-pulse", color: "#34C759", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-6", name: "Bills & Utilities", icon: "zap", color: "#FF6B00", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-7", name: "Travel", icon: "plane", color: "#5AC8FA", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-8", name: "Groceries", icon: "shopping-cart", color: "#30D158", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-9", name: "Education", icon: "book-open", color: "#BF5AF2", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-10", name: "Salary", icon: "briefcase", color: "#30D158", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-11", name: "UPI Transfer", icon: "arrow-left-right", color: "#5E5CE6", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-12", name: "Transfers", icon: "repeat", color: "#0A84FF", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-13", name: "Cashback & Rewards", icon: "gift", color: "#FFD60A", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-14", name: "Interest & Dividends", icon: "trending-up", color: "#34C759", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-15", name: "Refunds", icon: "rotate-ccw", color: "#64D2FF", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-16", name: "Investments", icon: "bar-chart-2", color: "#AF52DE", userId: GUEST_USER_ID, parentId: null },
        { id: "cat-17", name: "Other", icon: "circle", color: "#8E8E93", userId: GUEST_USER_ID, parentId: null },
    ];

    defaultCategories.forEach(cat => {
        store.categories.set(cat.id, {
            ...cat,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
    });

    (globalThis as any).__mockDbStore = store;
    saveToDiskSync(store);
    return store;
}

const memoryStore: StoreData = initStore();

function generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

class MockQuery {
    private collectionName: string;
    private filters: Array<{ field: string; op: string; value: any }> = [];
    private orderField?: string;
    private orderDir: "asc" | "desc" = "asc";
    private limitCount?: number;

    constructor(collectionName: string) {
        this.collectionName = collectionName;
    }

    where(field: string, op: string, value: any): MockQuery {
        const q = new MockQuery(this.collectionName);
        q.filters = [...this.filters, { field, op, value }];
        q.orderField = this.orderField;
        q.orderDir = this.orderDir;
        q.limitCount = this.limitCount;
        return q;
    }

    orderBy(field: string, direction: "asc" | "desc" = "asc"): MockQuery {
        const q = new MockQuery(this.collectionName);
        q.filters = [...this.filters];
        q.orderField = field;
        q.orderDir = direction;
        q.limitCount = this.limitCount;
        return q;
    }

    limit(n: number): MockQuery {
        const q = new MockQuery(this.collectionName);
        q.filters = [...this.filters];
        q.orderField = this.orderField;
        q.orderDir = this.orderDir;
        q.limitCount = n;
        return q;
    }

    async get() {
        const table = memoryStore[this.collectionName] || new Map();
        let items = Array.from(table.values());

        for (const { field, op, value } of this.filters) {
            items = items.filter(item => {
                const itemVal = item[field];
                if (op === "==") return itemVal === value;
                if (op === "!=") return itemVal !== value;
                if (op === ">=") return itemVal !== undefined && itemVal >= value;
                if (op === "<=") return itemVal !== undefined && itemVal <= value;
                if (op === ">") return itemVal !== undefined && itemVal > value;
                if (op === "<") return itemVal !== undefined && itemVal < value;
                return true;
            });
        }

        if (this.orderField) {
            const field = this.orderField;
            const dir = this.orderDir === "desc" ? -1 : 1;
            items.sort((a, b) => {
                const aVal = a[field] ?? "";
                const bVal = b[field] ?? "";
                if (aVal < bVal) return -1 * dir;
                if (aVal > bVal) return 1 * dir;
                return 0;
            });
        }

        if (this.limitCount !== undefined) {
            items = items.slice(0, this.limitCount);
        }

        const docs = items.map(item => ({
            id: item.id,
            exists: true,
            ref: new MockDocRef(this.collectionName, item.id),
            data: () => ({ ...item }),
        }));

        return {
            docs,
            empty: docs.length === 0,
            size: docs.length,
        };
    }
}

class MockDocRef {
    public id: string;
    private collectionName: string;

    constructor(collectionName: string, id: string) {
        this.collectionName = collectionName;
        this.id = id;
    }

    async get() {
        const table = memoryStore[this.collectionName] || new Map();
        const item = table.get(this.id);
        return {
            id: this.id,
            exists: Boolean(item),
            data: () => (item ? { ...item } : undefined),
        };
    }

    async set(data: any, options?: { merge?: boolean }) {
        if (!memoryStore[this.collectionName]) {
            memoryStore[this.collectionName] = new Map();
        }
        const existing = memoryStore[this.collectionName].get(this.id) || { id: this.id };
        const updated = options?.merge ? { ...existing, ...data, id: this.id } : { ...data, id: this.id };
        memoryStore[this.collectionName].set(this.id, updated);
        scheduleSave(memoryStore);
        return { writeTime: new Date() };
    }

    async update(data: any) {
        if (!memoryStore[this.collectionName]) {
            memoryStore[this.collectionName] = new Map();
        }
        const existing = memoryStore[this.collectionName].get(this.id);
        if (!existing) {
            throw new Error(`Document ${this.id} not found`);
        }
        const updated = { ...existing, ...data };
        memoryStore[this.collectionName].set(this.id, updated);
        scheduleSave(memoryStore);
        return { writeTime: new Date() };
    }

    async delete() {
        if (memoryStore[this.collectionName]) {
            memoryStore[this.collectionName].delete(this.id);
            scheduleSave(memoryStore);
        }
        return { writeTime: new Date() };
    }
}

class MockBatch {
    private ops: Array<() => Promise<void>> = [];

    set(docRef: MockDocRef, data: any, options?: { merge?: boolean }) {
        this.ops.push(() => docRef.set(data, options).then(() => {}));
        return this;
    }

    update(docRef: MockDocRef, data: any) {
        this.ops.push(() => docRef.update(data).then(() => {}));
        return this;
    }

    delete(docRef: MockDocRef) {
        this.ops.push(() => docRef.delete().then(() => {}));
        return this;
    }

    async commit() {
        for (const op of this.ops) {
            await op();
        }
        saveToDiskSync(memoryStore);
    }
}

export class MockFirestore {
    collection(name: string) {
        if (!memoryStore[name]) {
            memoryStore[name] = new Map();
        }
        const query = new MockQuery(name);
        return {
            where: query.where.bind(query),
            orderBy: query.orderBy.bind(query),
            limit: query.limit.bind(query),
            get: query.get.bind(query),
            doc: (id?: string) => new MockDocRef(name, id || generateId()),
            add: async (data: any) => {
                const id = generateId();
                const docRef = new MockDocRef(name, id);
                await docRef.set({ ...data, id });
                return docRef;
            },
        };
    }

    batch() {
        return new MockBatch();
    }
}

let mockInstance: MockFirestore | null = null;

export function getMockFirestore(): any {
    if (!mockInstance) {
        mockInstance = new MockFirestore();
    }
    return mockInstance;
}
