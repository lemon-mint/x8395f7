import { Arena } from "./arena.js";
import { compare_key } from "./bytes.js";
import { FSDriver } from "./fs_abst.js";
import { Context, SkipList } from "./skip.js";
import { WAL } from "./wal.js";

export class MemTable {
  _driver: FSDriver;
  _wal: WAL;
  _path: string;
  _prefix: string;
  _sync: boolean;
  _arena: Arena;
  _skip: SkipList;
  _maxsize: number;

  constructor(
    driver: FSDriver,
    path: string,
    prefix: string,
    maxsize: number,
    sync: boolean,
  ) {
    if (maxsize <= 0) {
      throw new Error("maxsize must be greater than 0");
    }

    this._driver = driver;
    this._wal = new WAL(driver, path, prefix);
    this._path = path;
    this._prefix = prefix;
    this._sync = sync;
    this._arena = new Arena(maxsize);
    this._skip = new SkipList(this._arena, compare_key);
    this._maxsize = maxsize;
  }

  freespace(): number {
    return this._maxsize - this._arena.len();
  }
}
