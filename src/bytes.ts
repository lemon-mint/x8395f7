export function compare(a: Uint8Array, b: Uint8Array) {
    let l = a.length;
    if (b.length < l) {
        l = b.length;
    }
    if (l == 0 || a === b) {
        return 0;
    }

    for (let i = 0; i < l; i++) {
        if (a[i] < b[i]) {
            return -1;
        } else if (a[i] > b[i]) {
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

