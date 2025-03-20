import { factory, detectPrng } from 'ulid';

export class Ulid {
  private static ulidGenerator = factory(detectPrng(false));

  static generateUlid(): string {
    return this.ulidGenerator();
  }
}
