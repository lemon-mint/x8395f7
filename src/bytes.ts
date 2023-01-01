export function compare(a: Uint8Array, b: Uint8Array) {
  let l = a.length;
  if (b.length < l) {
    l = b.length;
  }
  if (l == 0 || a === b) {
    return 0;
  }

  for (let i = 0; i < l; i++) {
    if (a[i]! < b[i]!) {
      return -1;
    } else if (a[i]! > b[i]!) {
      return 1;
    }
  }

  if (a.length < b.length) {
    return -1;
  }
  if (a.length > b.length) {
    return 1;
  }

  return 0;
}

export function compare_uint64(a: Uint8Array, a_offset: number, b: Uint8Array, b_offset: number) {
  let a_hi: number = a[a_offset]! << 24 | a[a_offset + 1]! << 16 | a[a_offset + 2]! << 8 | a[a_offset + 3]!;
  let a_lo: number = a[a_offset + 4]! << 24 | a[a_offset + 5]! << 16 | a[a_offset + 6]! << 8 | a[a_offset + 7]!;
  let b_hi: number = b[b_offset]! << 24 | b[b_offset + 1]! << 16 | b[b_offset + 2]! << 8 | b[b_offset + 3]!;
  let b_lo: number = b[b_offset + 4]! << 24 | b[b_offset + 5]! << 16 | b[b_offset + 6]! << 8 | b[b_offset + 7]!;

  if (a_hi == b_hi) {
    if (a_lo == b_lo) {
      return 0;
    } else if (a_lo < b_lo) {
      return -1;
    } else {
      return 1;
    }
  }

  if (a_hi < b_hi) {
    return -1;
  }
  return 1;
}

export function compare_key(a: Uint8Array, b: Uint8Array) {
  // Key Format:
  // data: len-8 bytes
  // ts: 8 bytes

  const a_data = a.subarray(0, a.length - 8);
  const b_data = b.subarray(0, b.length - 8);

  const cmp = compare(a_data, b_data);
  if (cmp != 0) {
    return cmp;
  }

  return compare_uint64(a, a.length - 8, b, b.length - 8);
}
