import { wyhash } from "wyhash";
import { compare } from "./bytes.js";
import { File, FSDriver, ReadFullAt, WriteFullAt } from "./fs_abst.js";

const WAL_NAME_LEN = 16;
const WAL_MAGIC = new TextEncoder().encode("WALx8395f7LLLLLL");

// WAL File Format
//
// 0-15: "WALx8395f7LLLLLL"
// 16-31: Random bytes
// 32-63: SHA256 of the 16-31 bytes
// 64-  : WAL entries

// WAL Entry Format
//
// 0-1 : Entry type
// 2-3 : Flags
// 4-11: Timestamp
// 12-15: Key length
// 16-19: Value length
//   -  : Key
//   -  : Value
//   -  : Checksum

export enum EntryType {
  Set = 1,
  Delete = 1 << 1,
}

export enum EntryFlag {
  TxStart = 1,
  TxCommit = 1 << 1,
  TxAbort = 1 << 2,
}

export class WAL {
  fs: FSDriver;
  path: string;
  prefix: string;
  file?: File;
  seed: bigint;
  offset: number = 64;

  constructor(fs: FSDriver, path: string, prefix: string) {
    this.fs = fs;
    this.path = path;
    this.prefix = prefix;
    this.seed = BigInt(42);
  }

  public async open() {
    const re = new RegExp(this.prefix + "(\\d+).wal");
    const wals = await (await this.fs.list(this.path)).
      filter((f) => f.startsWith(this.prefix)).
      filter((f) => f.endsWith(".wal")).
      filter((f) => re.test(f)).
      sort((a, b) => {
        const a1 = parseInt(re.exec(a)![1]);
        const b1 = parseInt(re.exec(b)![1]);
        return a1 - b1;
      });

    if (wals.length > 0) {
      const wal = wals[wals.length - 1];
      this.file = await this.fs.open(this.path + "/" + wal);

      const magic = new Uint8Array(WAL_MAGIC.length);
      await ReadFullAt(this.file, magic, 0);
      if (compare(magic, WAL_MAGIC) != 0) {
        throw new Error("Invalid WAL magic");
      }

      const rand = new Uint8Array(16);
      await ReadFullAt(this.file, rand, 16);

      const hash_file = new Uint8Array(32);
      await ReadFullAt(this.file, hash_file, 32);

      const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", rand));
      if (compare(hash, hash_file) != 0) {
        throw new Error("Invalid WAL hash, file is corrupted");
      }

      // Set the seed to the first 8 bytes of the random bytes.
      this.seed = BigInt(0);
      for (let i = 0; i < 8; i++) {
        this.seed = (this.seed << BigInt(8)) | BigInt(rand[i]);
      }
    } else {
      const wal = this.prefix + "0".padStart(WAL_NAME_LEN, "0") + ".wal";
      this.file = await this.fs.create(this.path + "/" + wal);
      await WriteFullAt(this.file, WAL_MAGIC, 0);

      const rand = crypto.getRandomValues(new Uint8Array(16));
      await WriteFullAt(this.file, rand, 16);

      const hash = new Uint8Array(await crypto.subtle.digest("SHA-256", rand));
      await WriteFullAt(this.file, hash, 32);

      // Sync the file to make sure the magic and hash are written.
      await this.file.sync();

      // Set the seed to the first 8 bytes of the random bytes.
      this.seed = BigInt(0);
      for (let i = 0; i < 8; i++) {
        this.seed = (this.seed << BigInt(8)) | BigInt(rand[i]);
      }
    }
  }

  public async WriteEntry(
    type: EntryType,
    flags: EntryFlag,
    timestamp: bigint,
    key: Uint8Array,
    value: Uint8Array,
  ) {
    const sum = wyhash(key, this.seed) ^ wyhash(value, this.seed);
    const entry = new Uint8Array(20 + key.length + value.length + 8);
    entry[0] = type;
    entry[1] = flags;
    entry[2] = Number(timestamp >> BigInt(56)) & 0xff;
    entry[3] = Number(timestamp >> BigInt(48)) & 0xff;
    entry[4] = Number(timestamp >> BigInt(40)) & 0xff;
    entry[5] = Number(timestamp >> BigInt(32)) & 0xff;
    entry[6] = Number(timestamp >> BigInt(24)) & 0xff;
    entry[7] = Number(timestamp >> BigInt(16)) & 0xff;
    entry[8] = Number(timestamp >> BigInt(8)) & 0xff;
    entry[9] = Number(timestamp) & 0xff;

    entry[10] = Number(key.length >> 24) & 0xff;
    entry[11] = Number(key.length >> 16) & 0xff;
    entry[12] = Number(key.length >> 8) & 0xff;
    entry[13] = Number(key.length) & 0xff;

    entry[14] = Number(value.length >> 24) & 0xff;
    entry[15] = Number(value.length >> 16) & 0xff;
    entry[16] = Number(value.length >> 8) & 0xff;
    entry[17] = Number(value.length) & 0xff;

    entry.set(key, 20);
    entry.set(value, 20 + key.length);

    entry[entry.length - 8] = Number(sum >> BigInt(56)) & 0xff;
    entry[entry.length - 7] = Number(sum >> BigInt(48)) & 0xff;
    entry[entry.length - 6] = Number(sum >> BigInt(40)) & 0xff;
    entry[entry.length - 5] = Number(sum >> BigInt(32)) & 0xff;
    entry[entry.length - 4] = Number(sum >> BigInt(24)) & 0xff;
    entry[entry.length - 3] = Number(sum >> BigInt(16)) & 0xff;
    entry[entry.length - 2] = Number(sum >> BigInt(8)) & 0xff;
    entry[entry.length - 1] = Number(sum) & 0xff;

    await WriteFullAt(this.file!, entry, this.offset);
    this.offset += entry.length;
  }

  public async close() {
    if (this.file) {
      await this.file.close();
      this.file = undefined;
    }
  }
}
