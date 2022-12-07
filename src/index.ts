const MAX_NODE_HEIGHT = 30;

function rand_height() {
    return (Math.random() * MAX_NODE_HEIGHT + 1) | 0;
}

class Arena {
    data: Uint8Array;
    size: number;
    offset: number;
    ref: number;

    constructor(size: number) {
        this.data = new Uint8Array(size);
        this.size = size;
        this.offset = 0;
        this.ref = 0;
    }

    public alloc(size: number): number {
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

    public IncRef() {
        this.ref++;
    }

    public DecRef(): boolean { // return true if the arena is safe to reuse
        this.ref--;
        if (this.ref <= 0) {
            this.reset();
            return true;
        }
        return false;
    }
}

class SkipListNode {
    value_offset: number;
    value_length: number;
    key_offset: number;
    key_length: number;
    height: number;
    layers: SkipListNode[];

    constructor (arena: Arena, key: Uint8Array, value: Uint8Array) {
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

