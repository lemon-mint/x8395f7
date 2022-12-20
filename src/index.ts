import { FSDriver } from "./fs_abst.js";

export class FS {
  _driver: FSDriver;
  constructor(driver: FSDriver) {
    this._driver = driver;
  }
  public driver(): FSDriver {
    return this._driver;
  }
}

