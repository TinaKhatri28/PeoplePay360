import fs from 'fs';
import path from 'path';
import { logger } from '../logger/logger';

export interface StorageProvider {
  upload(key: string, buffer: Buffer, contentType?: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<boolean>;
  getUrl(key: string): string;
}

export class LocalStorageProvider implements StorageProvider {
  private baseDir: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir || path.join(process.cwd(), 'data', 'uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async upload(key: string, buffer: Buffer): Promise<string> {
    const fullPath = path.join(this.baseDir, key);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    await fs.promises.writeFile(fullPath, buffer);
    return this.getUrl(key);
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, key);
    return fs.promises.readFile(fullPath);
  }

  async delete(key: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.baseDir, key);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
      return true;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    return `/uploads/${key}`;
  }
}

/**
 * Storage Service Factory:
 * Defaults to LocalStorageProvider, seamlessly switchable to S3 / Cloud Object Storage
 */
export class StorageService {
  private provider: StorageProvider;

  constructor(provider?: StorageProvider) {
    this.provider = provider || new LocalStorageProvider();
  }

  setProvider(provider: StorageProvider) {
    this.provider = provider;
  }

  async storePayslip(payslipId: string, pdfBuffer: Buffer): Promise<string> {
    const key = `payslips/${payslipId}.pdf`;
    logger.info(`Storing payslip PDF with key: ${key}`);
    return this.provider.upload(key, pdfBuffer, 'application/pdf');
  }

  async getFile(key: string): Promise<Buffer> {
    return this.provider.download(key);
  }

  async deleteFile(key: string): Promise<boolean> {
    return this.provider.delete(key);
  }
}

export const storageService = new StorageService();
