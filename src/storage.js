/**
 * Content-addressed blob storage adapter.
 * Supports local filesystem (default) and S3-compatible backends.
 */
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";

export class LocalStorage {
  constructor(baseDir = ".component-hub/blobs") {
    this.baseDir = baseDir;
  }

  async put(content, contentType = "application/wasm") {
    const hash = createHash("sha256").update(content).digest("hex");
    const dir = join(this.baseDir, hash.slice(0, 2), hash.slice(2, 4));
    const filePath = join(dir, hash);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, content);
    const s = await stat(filePath);
    return { hash, size: s.size, contentType };
  }

  async get(hash) {
    const filePath = join(this.baseDir, hash.slice(0, 2), hash.slice(2, 4), hash);
    try {
      return await readFile(filePath);
    } catch {
      return null;
    }
  }

  async exists(hash) {
    const filePath = join(this.baseDir, hash.slice(0, 2), hash.slice(2, 4), hash);
    try {
      await stat(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
