export interface File {
  seek(offset: number): Promise<void>;
  read(dst: Uint8Array): Promise<number>;
  pread(dst: Uint8Array, offset: number): Promise<number>;
  write(src: Uint8Array): Promise<number>;
  pwrite(src: Uint8Array, offset: number): Promise<number>;
  close(): Promise<void>;
  sync(): Promise<void>;
}

export interface FSDriver {
  open(path: string): Promise<File>;
  create(path: string): Promise<File>;
  unlink(path: string): Promise<void>;
  mkdir(path: string): Promise<void>;
  rmdir(path: string): Promise<void>;
  rename(oldPath: string, newPath: string): Promise<void>;
  stat(path: string): Promise<FileStat>;
  list(path: string): Promise<string[]>;
}

export interface FileStat {
  isFile(): boolean;
  isDirectory(): boolean;
  size(): number;
}

export const ErrUnexpectedEOF = "Unexpected EOF"

export async function ReadFull(f: File, buf: Uint8Array): Promise<void> {
  let n = 0;
  while (n < buf.length) {
    const n2 = await f.read(buf.subarray(n));
    n += n2;
  }
}

export async function ReadFullAt(f: File, buf: Uint8Array, offset: number): Promise<void> {
  let n = 0;
  while (n < buf.length) {
    const n2 = await f.pread(buf.subarray(n), offset + n);
    n += n2;
  }
}

export async function WriteFull(f: File, buf: Uint8Array): Promise<void> {
  let n = 0;
  while (n < buf.length) {
    const n2 = await f.write(buf.subarray(n));
    n += n2;
  }
}

export async function WriteFullAt(f: File, buf: Uint8Array, offset: number): Promise<void> {
  let n = 0;
  while (n < buf.length) {
    const n2 = await f.pwrite(buf.subarray(n), offset + n);
    n += n2;
  }
}
