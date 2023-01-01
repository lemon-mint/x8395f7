import { FSDriver } from "./fs_abst.js";
import { FS_DRIVER_NODE } from "./fs_node.js";
import { WAL } from "./wal.js";

export class MemTable {
  _driver: FSDriver;
  _wal: WAL;
  constructor(driver: FSDriver) {
    this._driver = driver;
    this._wal = new WAL(driver, "./wal", "0x8395f7");
  }

  async open() {
    await this._wal.open();
  }

  public driver(): FSDriver {
    return this._driver;
  }
}

const driver = FS_DRIVER_NODE;
