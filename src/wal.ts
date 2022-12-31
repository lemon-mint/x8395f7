import { compare } from "./bytes.js";
import { File, FSDriver } from "./fs_abst.js";

const WAL_NAME_LEN = 16;
const WAL_MAGIC = new TextEncoder().encode("WALx8395f7LLLLLL");

export class WAL {
  fs: FSDriver;
  path: string;
  prefix: string;
  file?: File;
  constructor(fs: FSDriver, path: string, prefix: string) {
    this.fs = fs;
    this.path = path;
    this.prefix = prefix;
  }

  async open() {
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
      const buf = new Uint8Array(WAL_MAGIC.length);

      let n = 0;
      while (n < WAL_MAGIC.length) {
        const n2 = await this.file.pread(buf.subarray(n), n);
        n += n2;
      }

      if (compare(buf, WAL_MAGIC) != 0) {
        throw new Error("Invalid WAL magic");
      }
    } else {
      const wal = this.prefix + "0".padStart(WAL_NAME_LEN, "0") + ".wal";
      this.file = await this.fs.create(this.path + "/" + wal);
      let n = await this.file.pwrite(WAL_MAGIC, 0);
      if (n != WAL_MAGIC.length) {
        throw new Error("Failed to write WAL magic");
      }
    }


  }

  async close() {
    if (this.file) {
      await this.file.close();
      this.file = undefined;
    }
  }
}
