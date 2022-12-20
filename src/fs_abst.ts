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
