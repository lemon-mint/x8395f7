"use strict";
const MAX_NODE_HEIGHT = 30;
function rand_height() {
    return (Math.random() * MAX_NODE_HEIGHT + 1) | 0;
}
class Arena {
    data;
    size;
    offset;
    ref;
    constructor(size) {
        this.data = new Uint8Array(size);
        this.size = size;
        this.offset = 0;
        this.ref = 0;
    }
    alloc(size) {
        if (this.offset + size > this.size) {
            return -1; // out of memory
        }
        const offset = this.offset;
        this.offset += size;
        return offset;
    }
    reset() {
        this.offset = 0;
    }
    IncRef() {
        this.ref++;
    }
    DecRef() {
        this.ref--;
        if (this.ref <= 0) {
            this.reset();
            return true;
        }
        return false;
    }
}
class SkipListNode {
    value_offset;
    value_length;
    key_offset;
    key_length;
    height;
    layers;
    constructor(arena, key, value) {
        const v_off = arena.alloc(value.length);
        const k_off = arena.alloc(key.length);
        if (v_off < 0 || k_off < 0) {
            throw new Error('out of memory');
        }
        this.value_offset = v_off;
        this.key_offset = k_off;
        this.value_length = value.length;
        this.key_length = key.length;
        arena.data.set(value, v_off);
        arena.data.set(key, k_off);
        this.height = rand_height();
        this.layers = new Array(this.height);
    }
}
