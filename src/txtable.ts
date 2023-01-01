import { Arena } from "./arena.js";
import { Context, SkipList, SkipListIterator } from "./skip.js";

class TxTable {
    _skip: SkipList;
    _arena: Arena;

    constructor(arena: Arena) {
        this._arena = arena;
        this._skip = new SkipList(arena);
    }

    search(key: Uint8Array): Uint8Array | null {
        const ctx = new Context(this._arena);
        const node = this._skip.search(key, ctx);
        if (node) {
            return node.value();
        }
        return null;
    }

    insert(key: Uint8Array, value: Uint8Array): boolean {
        const ctx = new Context(this._arena);
        const node = this._skip.search(key, ctx);
        if (node) {
            return false;
        }
        this._skip.insert(key, value, ctx);
        return true;
    }

    delete(key: Uint8Array): boolean {
        const ctx = new Context(this._arena);
        return this._skip.delete(key, ctx);
    }
}
