import { factory, detectPrng, decodeTime } from 'ulid';

export class Ulid {
  private static ulidGenerator = factory(detectPrng(false));

  static generateUlid(): string {
    return this.ulidGenerator();
  }

  static async getTimestamp(ulid: string): Promise<number> {
    return Promise.resolve(decodeTime(ulid));
  }

  static async isExpired(ulid: string, expiryMs: number = 15 * 60 * 1000): Promise<boolean> {
    const createdAt = await this.getTimestamp(ulid);
    return Promise.resolve(Date.now() > createdAt + expiryMs);
  }
}
