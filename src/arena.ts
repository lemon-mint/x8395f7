export class Arena {
  buffer: Uint8Array;
  size: number;
  offset: number;
  ref: number;

  constructor(size: number) {
    this.buffer = new Uint8Array(size);
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

  public data(offset: number, size: number): Uint8Array {
    return this.buffer.subarray(offset, offset + size);
  }

  public reset() {
    this.offset = 0;
  }

  public len(): number {
    return this.offset;
  }

  public IncRef() {
    this.ref++;
  }

  public DecRef(): boolean {
    // return true if the arena is safe to reuse
    this.ref--;
    if (this.ref <= 0) {
      this.reset();
      return true;
    }
    return false;
  }
}
