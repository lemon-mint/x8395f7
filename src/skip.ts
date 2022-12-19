import { Arena } from "./arena.js";
import { compare } from "./bytes.js";

export const MAX_NODE_HEIGHT = 20;
export const ERR_OOM = "OOM";

function rand_level(): number {
  let i = 1;
  for (; i < MAX_NODE_HEIGHT; i++) {
    if (Math.random() > 0.5) {
      return i;
    }
  }
  return i;
}

export class Context {
  arena: Arena;
  lv: SkipNode[];
  constructor(arena: Arena) {
    this.arena = arena;
    this.lv = new Array(MAX_NODE_HEIGHT);
  }
  reset(head: SkipNode) {
    for (let i = 0; i < MAX_NODE_HEIGHT; i++) {
      this.lv[i] = head;
    }
  }
}

export class SkipList {
  arena: Arena;
  comparator: (a: Uint8Array, b: Uint8Array) => number;
  head: SkipNode;
  tail: SkipNode;

  constructor(
    arena: Arena,
    comparator?: (a: Uint8Array, b: Uint8Array) => number
  ) {
    this.arena = arena;
    this.comparator = comparator || compare;
    this.tail = new SkipNode(
      this.arena,
      0, 0, 0, 0,
      Tag.vTail,
      MAX_NODE_HEIGHT,
    );
    this.head = new SkipNode(
      this.arena,
      0, 0, 0, 0,
      Tag.vHead,
      MAX_NODE_HEIGHT,
    );
    for (let i = 0; i < MAX_NODE_HEIGHT; i++) {
      this.head.next[i] = this.tail;
    }
  }

  public search(key: Uint8Array, ctx: Context): SkipNode|null {
    ctx.reset(this.head); // reset context
    let x = this.head; // start from head
    for (let i = MAX_NODE_HEIGHT - 1; i >= 0; i--) { // scan from top pointer
      while (!x.next[i].isTail() && this.comparator(x.next[i].key(), key) < 0) {
        x = x.next[i]; // move to next node
      }
      ctx.lv[i] = x; // store the current position in context
    }
    x = x.next[0];
    if (x.isTail() || this.comparator(x.key(), key) !== 0) {
      return null;
    }
    return x;
  }

  public insert(key: Uint8Array, value: Uint8Array, ctx: Context): SkipNode {
    const x = this.search(key, ctx);
    if (x) { // If key already exists, update the value
      x.SetValue(value);
      return x;
    }

    // If key does not exist, insert a new node
    const level = rand_level();
    const node = new SkipNode(
      this.arena,
      0, 0, 0, 0,
      Tag.vNode,
      level,
    );

    // Allocate memory for key and value
    node.SetKey(key);
    node.SetValue(value);

    // Insert the node into the skip list
    for (let i = 0; i < level; i++) {
      node.next[i] = ctx.lv[i].next[i];
      ctx.lv[i].next[i] = node;
    }

    return node;
  }

  public insert_from_arena(
    key_offset: number,
    key_size: number,
    value_offset: number,
    value_size: number,
    ctx: Context,
  ): SkipNode {
    const x = this.search(this.arena.data(key_offset, key_size), ctx);
    if (x) { // If key already exists, update the value
      x.value_offset = value_offset;
      x.value_size = value_size;
      return x;
    }

    // If key does not exist, insert a new node
    const level = rand_level();
    const node = new SkipNode(
      this.arena,
      0, 0, 0, 0,
      Tag.vNode,
      level,
    );

    node.key_offset = key_offset;
    node.key_size = key_size;
    node.value_offset = value_offset;
    node.value_size = value_size;

    // Insert the node into the skip list
    for (let i = 0; i < level; i++) {
      node.next[i] = ctx.lv[i].next[i];
      ctx.lv[i].next[i] = node;
    }

    return node;
  }

  public delete(key: Uint8Array, ctx: Context): boolean {
    const x = this.search(key, ctx);
    if (!x) { // If key does not exist, return false
      return false;
    }

    for (let i = 0; i < x.height; i++) {
      ctx.lv[i].next[i] = x.next[i]; // link the previous node to the next node
    }
    return true;
  }

  public reset() {
    this.arena.reset();
    for (let i = 0; i < MAX_NODE_HEIGHT; i++) {
      this.head.next[i] = this.tail; // reset head
    }
  }

  public toString(): string {
    let s = "[HEAD] -> ";
    let x = this.head.next[0];
    while (!x.isTail()) {
      s += `[${x.key()}] -> `;
      x = x.next[0];
    }
    s += "[TAIL]";

    return s;
  }

  public iterator(): SkipListIterator {
    return new SkipListIterator(this);
  }
}

export class SkipListIterator {
  list: SkipList;
  ctx: Context;
  value: SkipNode|null;

  constructor(list: SkipList) {
    this.list = list;
    this.ctx = new Context(list.arena);
    this.ctx.reset(list.head);
    this.value = null;
  }

  public seek(key: Uint8Array): SkipNode|null {
    const node = this.list.search(key, this.ctx);
    this.value = node;
    return node;
  }

  public rewind(): void {
    this.ctx.reset(this.list.head);
    this.value = null;
  }

  public next() {
    if (!this.value) {
      this.value = this.ctx.lv[0].next[0];
    } else {
      this.value = this.value.next[0];
    }

    if (this.value.isTail()) {
      return { done: true, value: undefined };
    }
    return { done: false, value: this.value };
  }

  [Symbol.iterator]() {
    return this;
  }
}

export enum Tag {
  vHead = 0x00,
  vNode = 0x01,
  vTail = 0x02,
}

export class SkipNode {
  arena: Arena;
  key_offset: number;
  key_size: number;
  value_offset: number;
  value_size: number;
  tag: Tag;
  height: number;
  next: SkipNode[];

  constructor(
    arena: Arena,
    key_offset: number,
    key_size: number,
    value_offset: number,
    value_size: number,
    tag: Tag,
    height: number,
  ) {
    this.arena = arena;
    this.key_offset = key_offset;
    this.key_size = key_size;
    this.value_offset = value_offset;
    this.value_size = value_size;
    this.tag = tag;
    this.height = height;
    this.next = new Array(height);
  }

  public key(): Uint8Array {
    return this.arena.data(this.key_offset, this.key_size);
  }

  public value(): Uint8Array {
    return this.arena.data(this.value_offset, this.value_size);
  }

  public SetKey(key: Uint8Array) {
    this.key_offset = this.arena.alloc(key.length);
    if (this.key_offset < 0) {
      throw new Error(ERR_OOM);
    }
    this.key_size = key.length;
    this.arena.data(this.key_offset, this.key_size).set(key);
  }

  public SetValue(value: Uint8Array) {
    this.value_offset = this.arena.alloc(value.length);
    if (this.value_offset < 0) {
      throw new Error(ERR_OOM);
    }
    this.value_size = value.length;
    this.arena.data(this.value_offset, this.value_size).set(value);
  }

  public isHead(): boolean {
    return this.tag === Tag.vHead;
  }

  public isTail(): boolean {
    return this.tag === Tag.vTail;
  }
}
