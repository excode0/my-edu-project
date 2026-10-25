import "server-only"

export interface StorageAdapter {
  upload(file: Buffer, filename: string, contentType: string): Promise<{ key: string; url: string }>
  delete(key: string): Promise<void>
  getUrl(key: string): string
}

export class LocalStorageAdapter implements StorageAdapter {
  async upload(file: Buffer, filename: string, contentType: string) {
    return { key: filename, url: `/uploads/${filename}` }
  }
  async delete(key: string) {
    return
  }
  getUrl(key: string) {
    return `/uploads/${key}`
  }
}

export const storage = new LocalStorageAdapter()
