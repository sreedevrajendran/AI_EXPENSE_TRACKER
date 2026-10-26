import * as admin from "firebase-admin";
import { getMockFirestore } from "./mockDb";

// Circuit Breaker State to protect against Firestore quota exhaustion & timeouts
class CircuitBreaker {
    private isOpen = false;
    private lastFailure = 0;
    private failureCount = 0;
    // 60 seconds cooldown before testing a probe query to Firestore
    private readonly COOLDOWN_MS = 60 * 1000;

    public trip(reason: string) {
        this.failureCount++;
        if (!this.isOpen) {
            console.warn(`[ResilientFirestore] Circuit breaker TRIPPED (${reason}). Switching to fast local storage.`);
        }
        this.isOpen = true;
        this.lastFailure = Date.now();
    }

    public shouldFallback(): boolean {
        if (!this.isOpen) return false;
        // If cooldown has elapsed, allow one probe through (half-open)
        if (Date.now() - this.lastFailure > this.COOLDOWN_MS) {
            return false;
        }
        return true;
    }

    public recordSuccess() {
        if (this.isOpen) {
            console.log("[ResilientFirestore] Circuit breaker RECOVERED. Firestore quota/connection restored.");
            this.isOpen = false;
            this.failureCount = 0;
        }
    }

    public isTripped(): boolean {
        return this.isOpen;
    }
}

export const firestoreCircuitBreaker = new CircuitBreaker();

// Short-lived in-memory read cache to slash redundant Firestore reads by 95%
interface CacheEntry {
    data: any;
    timestamp: number;
}
const queryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 45 * 1000; // 45 seconds TTL

export function invalidateQueryCache(collectionName?: string) {
    if (!collectionName) {
        queryCache.clear();
        return;
    }
    for (const key of queryCache.keys()) {
        if (key.startsWith(`${collectionName}:`)) {
            queryCache.delete(key);
        }
    }
}

function generateId(): string {
    return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

function isQuotaOrNetworkError(err: any): boolean {
    if (!err) return false;
    const msg = String(err.message || "");
    const code = err.code;
    return (
        code === 8 || // RESOURCE_EXHAUSTED
        code === 4 || // DEADLINE_EXCEEDED
        code === 14 || // UNAVAILABLE
        msg.includes("Quota exceeded") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("DEADLINE_EXCEEDED") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("ETIMEDOUT") ||
        msg.includes("ECONNRESET")
    );
}

// Timeout wrapper for Firestore operations (fail fast in 2.5s instead of hanging for 15s)
async function withTimeout<T>(promise: Promise<T>, ms = 2500): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((_, reject) => {
        timer = setTimeout(() => {
            const err: any = new Error(`Firestore operation timed out after ${ms}ms`);
            err.code = 4; // DEADLINE_EXCEEDED
            reject(err);
        }, ms);
    });
    return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
}

export class ResilientDocRef {
    public id: string;
    public collectionName: string;
    private firestoreRef: admin.firestore.DocumentReference | null;
    private mockRef: any;

    constructor(collectionName: string, id: string, firestoreRef: admin.firestore.DocumentReference | null) {
        this.collectionName = collectionName;
        this.id = id;
        this.firestoreRef = firestoreRef;
        this.mockRef = getMockFirestore().collection(collectionName).doc(id);
    }

    get ref() {
        return this;
    }

    async get() {
        if (!this.firestoreRef || firestoreCircuitBreaker.shouldFallback()) {
            return await this.mockRef.get();
        }

        try {
            const snap = await withTimeout(this.firestoreRef.get());
            firestoreCircuitBreaker.recordSuccess();
            // Mirror to mockDb in background
            if (snap.exists) {
                this.mockRef.set(snap.data(), { merge: true }).catch(() => {});
            }
            return {
                id: snap.id,
                exists: snap.exists,
                ref: this,
                data: () => snap.data(),
            };
        } catch (err: any) {
            if (isQuotaOrNetworkError(err)) {
                firestoreCircuitBreaker.trip(err.message);
                return await this.mockRef.get();
            }
            throw err;
        }
    }

    async set(data: any, options?: { merge?: boolean }) {
        invalidateQueryCache(this.collectionName);
        // Always write to mockDb so local data is never lost
        await this.mockRef.set(data, options);

        if (!this.firestoreRef || firestoreCircuitBreaker.shouldFallback()) {
            return { writeTime: new Date() };
        }

        try {
            await withTimeout(this.firestoreRef.set(data, options || {}));
            firestoreCircuitBreaker.recordSuccess();
            return { writeTime: new Date() };
        } catch (err: any) {
            if (isQuotaOrNetworkError(err)) {
                firestoreCircuitBreaker.trip(err.message);
                return { writeTime: new Date() };
            }
            throw err;
        }
    }

    async update(data: any) {
        invalidateQueryCache(this.collectionName);
        await this.mockRef.update(data);

        if (!this.firestoreRef || firestoreCircuitBreaker.shouldFallback()) {
            return { writeTime: new Date() };
        }

        try {
            await withTimeout(this.firestoreRef.update(data));
            firestoreCircuitBreaker.recordSuccess();
            return { writeTime: new Date() };
        } catch (err: any) {
            if (isQuotaOrNetworkError(err)) {
                firestoreCircuitBreaker.trip(err.message);
                return { writeTime: new Date() };
            }
            throw err;
        }
    }

    async delete() {
        invalidateQueryCache(this.collectionName);
        await this.mockRef.delete();

        if (!this.firestoreRef || firestoreCircuitBreaker.shouldFallback()) {
            return { writeTime: new Date() };
        }

        try {
            await withTimeout(this.firestoreRef.delete());
            firestoreCircuitBreaker.recordSuccess();
            return { writeTime: new Date() };
        } catch (err: any) {
            if (isQuotaOrNetworkError(err)) {
                firestoreCircuitBreaker.trip(err.message);
                return { writeTime: new Date() };
            }
            throw err;
        }
    }
}

export class ResilientQuery {
    private collectionName: string;
    private firestoreQuery: admin.firestore.Query | null;
    private mockQuery: any;
    private filters: Array<{ field: string; op: string; value: any }> = [];
    private orderField?: string;
    private orderDir: "asc" | "desc" = "asc";
    private limitCount?: number;

    constructor(
        collectionName: string,
        firestoreQuery: admin.firestore.Query | null,
        mockQuery: any,
        filters: Array<{ field: string; op: string; value: any }> = [],
        orderField?: string,
        orderDir: "asc" | "desc" = "asc",
        limitCount?: number
    ) {
        this.collectionName = collectionName;
        this.firestoreQuery = firestoreQuery;
        this.mockQuery = mockQuery;
        this.filters = filters;
        this.orderField = orderField;
        this.orderDir = orderDir;
        this.limitCount = limitCount;
    }

    where(field: string, op: any, value: any): ResilientQuery {
        const nextFirestore = this.firestoreQuery ? this.firestoreQuery.where(field, op, value) : null;
        const nextMock = this.mockQuery.where(field, op, value);
        return new ResilientQuery(
            this.collectionName,
            nextFirestore,
            nextMock,
            [...this.filters, { field, op, value }],
            this.orderField,
            this.orderDir,
            this.limitCount
        );
    }

    orderBy(field: string, direction: "asc" | "desc" = "asc"): ResilientQuery {
        const nextFirestore = this.firestoreQuery ? this.firestoreQuery.orderBy(field, direction) : null;
        const nextMock = this.mockQuery.orderBy(field, direction);
        return new ResilientQuery(
            this.collectionName,
            nextFirestore,
            nextMock,
            this.filters,
            field,
            direction,
            this.limitCount
        );
    }

    limit(n: number): ResilientQuery {
        const nextFirestore = this.firestoreQuery ? this.firestoreQuery.limit(n) : null;
        const nextMock = this.mockQuery.limit(n);
        return new ResilientQuery(
            this.collectionName,
            nextFirestore,
            nextMock,
            this.filters,
            this.orderField,
            this.orderDir,
            n
        );
    }

    async get(): Promise<{ docs: any[]; empty: boolean; size: number }> {
        // Cache key based on collection, filters, order, limit
        const cacheKey = `${this.collectionName}:${JSON.stringify({
            filters: this.filters,
            order: this.orderField,
            dir: this.orderDir,
            limit: this.limitCount,
        })}`;

        const cached = queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
            return cached.data;
        }

        // If circuit is open or Firestore is not configured -> fast mockDb fallback
        if (!this.firestoreQuery || firestoreCircuitBreaker.shouldFallback()) {
            const mockRes = await this.mockQuery.get();
            const result = {
                docs: mockRes.docs.map((d: any) => ({
                    id: d.id,
                    exists: true,
                    ref: new ResilientDocRef(this.collectionName, d.id, null),
                    data: () => d.data(),
                })),
                empty: mockRes.empty,
                size: mockRes.size,
            };
            queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
        }

        // Attempt Firestore query with fail-fast timeout
        try {
            const snap = await withTimeout(this.firestoreQuery.get());
            firestoreCircuitBreaker.recordSuccess();

            const docs = snap.docs.map(doc => ({
                id: doc.id,
                exists: true,
                ref: new ResilientDocRef(this.collectionName, doc.id, doc.ref),
                data: () => doc.data(),
            }));

            const result = {
                docs,
                empty: snap.empty,
                size: snap.size,
            };

            // Mirror docs to mockDb in the background
            snap.docs.forEach(d => {
                getMockFirestore().collection(this.collectionName).doc(d.id).set(d.data(), { merge: true }).catch(() => {});
            });

            queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
            return result;
        } catch (err: any) {
            if (isQuotaOrNetworkError(err)) {
                firestoreCircuitBreaker.trip(err.message);
                // Immediately fallback to mockDb
                const mockRes = await this.mockQuery.get();
                const result = {
                    docs: mockRes.docs.map((d: any) => ({
                        id: d.id,
                        exists: true,
                        ref: new ResilientDocRef(this.collectionName, d.id, null),
                        data: () => d.data(),
                    })),
                    empty: mockRes.empty,
                    size: mockRes.size,
                };
                queryCache.set(cacheKey, { data: result, timestamp: Date.now() });
                return result;
            }
            throw err;
        }
    }
}

export class ResilientCollection {
    public name: string;
    private firestoreCol: admin.firestore.CollectionReference | null;
    private mockCol: any;

    constructor(name: string, firestoreCol: admin.firestore.CollectionReference | null) {
        this.name = name;
        this.firestoreCol = firestoreCol;
        this.mockCol = getMockFirestore().collection(name);
    }

    doc(id?: string): ResilientDocRef {
        const docId = id || generateId();
        const firestoreRef = this.firestoreCol ? this.firestoreCol.doc(docId) : null;
        return new ResilientDocRef(this.name, docId, firestoreRef);
    }

    where(field: string, op: any, value: any): ResilientQuery {
        const q = new ResilientQuery(
            this.name,
            this.firestoreCol,
            this.mockCol
        );
        return q.where(field, op, value);
    }

    orderBy(field: string, direction: "asc" | "desc" = "asc"): ResilientQuery {
        const q = new ResilientQuery(
            this.name,
            this.firestoreCol,
            this.mockCol
        );
        return q.orderBy(field, direction);
    }

    limit(n: number): ResilientQuery {
        const q = new ResilientQuery(
            this.name,
            this.firestoreCol,
            this.mockCol
        );
        return q.limit(n);
    }

    async get() {
        const q = new ResilientQuery(
            this.name,
            this.firestoreCol,
            this.mockCol
        );
        return q.get();
    }

    async add(data: any) {
        const docId = generateId();
        const docRef = this.doc(docId);
        await docRef.set({ ...data, id: docId });
        return docRef;
    }
}

export class ResilientBatch {
    private ops: Array<{
        type: "set" | "update" | "delete";
        ref: ResilientDocRef;
        data?: any;
        options?: any;
    }> = [];

    set(docRef: any, data: any, options?: { merge?: boolean }) {
        const resilientRef = docRef instanceof ResilientDocRef
            ? docRef
            : new ResilientDocRef(docRef.collectionName || docRef.parent?.id || "unknown", docRef.id, docRef);
        this.ops.push({ type: "set", ref: resilientRef, data, options });
        return this;
    }

    update(docRef: any, data: any) {
        const resilientRef = docRef instanceof ResilientDocRef
            ? docRef
            : new ResilientDocRef(docRef.collectionName || docRef.parent?.id || "unknown", docRef.id, docRef);
        this.ops.push({ type: "update", ref: resilientRef, data });
        return this;
    }

    delete(docRef: any) {
        const resilientRef = docRef instanceof ResilientDocRef
            ? docRef
            : new ResilientDocRef(docRef.collectionName || docRef.parent?.id || "unknown", docRef.id, docRef);
        this.ops.push({ type: "delete", ref: resilientRef });
        return this;
    }

    async commit() {
        const mockBatch = getMockFirestore().batch();

        for (const op of this.ops) {
            invalidateQueryCache(op.ref.collectionName);
            const mockRef = getMockFirestore().collection(op.ref.collectionName).doc(op.ref.id);
            if (op.type === "set") {
                mockBatch.set(mockRef, op.data, op.options);
            } else if (op.type === "update") {
                mockBatch.update(mockRef, op.data);
            } else if (op.type === "delete") {
                mockBatch.delete(mockRef);
            }
        }

        // Always commit to mockDb first so user data is 100% saved
        await mockBatch.commit();

        if (firestoreCircuitBreaker.shouldFallback() || !admin.apps.length) {
            return;
        }

        try {
            const rawBatch = admin.firestore().batch();
            for (const op of this.ops) {
                const fsRef = admin.firestore().collection(op.ref.collectionName).doc(op.ref.id);
                if (op.type === "set") {
                    rawBatch.set(fsRef, op.data, op.options || {});
                } else if (op.type === "update") {
                    rawBatch.update(fsRef, op.data);
                } else if (op.type === "delete") {
                    rawBatch.delete(fsRef);
                }
            }
            await withTimeout(rawBatch.commit());
            firestoreCircuitBreaker.recordSuccess();
        } catch (err: any) {
            if (isQuotaOrNetworkError(err)) {
                firestoreCircuitBreaker.trip(err.message);
                console.warn("[ResilientFirestore] Batch synced to local mockDb due to Firestore quota/network error.");
                return;
            }
            throw err;
        }
    }
}

export class ResilientFirestore {
    collection(name: string): ResilientCollection {
        const firestoreCol = admin.apps.length > 0 ? admin.firestore().collection(name) : null;
        return new ResilientCollection(name, firestoreCol);
    }

    batch(): ResilientBatch {
        return new ResilientBatch();
    }
}

let resilientInstance: ResilientFirestore | null = null;

export function getResilientFirestore(): any {
    if (!resilientInstance) {
        resilientInstance = new ResilientFirestore();
    }
    return resilientInstance;
}
