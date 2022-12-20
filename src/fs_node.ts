import { File, FileStat, FSDriver } from "./fs_abst.js";
import * as fs from "node:fs/promises";

export const FS_DRIVER_NODE: FSDriver = {
  open: async (path: string): Promise<File> => {
    const file = await fs.open(path, "r+");
    const nf = {
      file,
      offset: 0,
      seek: async (offset: number) => {
        nf.offset = offset;
      },
      read: async (dst: Uint8Array) => {
        const { bytesRead } = await file.read(dst, 0, dst.length, nf.offset);
        nf.offset += bytesRead;
        return bytesRead;
      },
      pread: async (dst: Uint8Array, offset: number) => {
        const { bytesRead } = await file.read(dst, 0, dst.length, offset);
        return bytesRead;
      },
      write: async (src: Uint8Array) => {
        const { bytesWritten } = await file.write(
          src,
          0,
          src.length,
          nf.offset
        );
        nf.offset += bytesWritten;
        return bytesWritten;
      },
      pwrite: async (src: Uint8Array, offset: number) => {
        const { bytesWritten } = await file.write(src, 0, src.length, offset);
        return bytesWritten;
      },
      close: () => {
        return file.close();
      },
      sync: () => {
        return file.sync();
      },
    };
    return nf;
  },
  create: async (path: string): Promise<File> => {
    const file = await fs.open(path, "w+");
    const nf = {
      file,
      offset: 0,
      seek: async (offset: number) => {
        nf.offset = offset;
      },
      read: async (dst: Uint8Array) => {
        const { bytesRead } = await file.read(dst, 0, dst.length, nf.offset);
        nf.offset += bytesRead;
        return bytesRead;
      },
      pread: async (dst: Uint8Array, offset: number) => {
        const { bytesRead } = await file.read(dst, 0, dst.length, offset);
        return bytesRead;
      },
      write: async (src: Uint8Array) => {
        const { bytesWritten } = await file.write(
          src,
          0,
          src.length,
          nf.offset
        );
        nf.offset += bytesWritten;
        return bytesWritten;
      },
      pwrite: async (src: Uint8Array, offset: number) => {
        const { bytesWritten } = await file.write(src, 0, src.length, offset);
        return bytesWritten;
      },
      close: () => {
        return file.close();
      },
      sync: () => {
        return file.sync();
      },
    };
    return nf;
  },
  unlink: (path: string): Promise<void> => {
    return fs.unlink(path);
  },
  mkdir: (path: string): Promise<void> => {
    return fs.mkdir(path);
  },
  rmdir: (path: string): Promise<void> => {
    return fs.rmdir(path);
  },
  rename: (oldPath: string, newPath: string): Promise<void> => {
    return fs.rename(oldPath, newPath);
  },
  stat: async (path: string): Promise<FileStat> => {
    const stat = await fs.stat(path);
    const nf = {
      isFile: () => {
        return stat.isFile();
      },
      isDirectory: () => {
        return stat.isDirectory();
      },
      size: () => {
        return stat.size;
      },
    };
    return nf;
  },
  list: (path: string): Promise<string[]> => {
    return fs.readdir(path);
  },
};
