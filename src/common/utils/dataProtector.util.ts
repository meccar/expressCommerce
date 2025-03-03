import { vaultService } from "@infrastructure/vault/vault.service";
import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;
const createHashAsync = async (text: string) =>
  crypto.createHash("sha256").update(text).digest();

export async function encrypt(
  text: string,
  keyText: string,
  noIV = false
): Promise<string> {
  const iv = noIV ? Buffer.alloc(IV_LENGTH, 0) : crypto.randomBytes(IV_LENGTH);
  const key = await createHashAsync(keyText);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export async function decrypt(
  encryptedText: string,
  keyText: string,
  noIV = false
): Promise<string> {
  if (!encryptedText || !encryptedText.includes(":")) return "";
  const [ivHex, encryptedHex] = encryptedText.split(":");
  const iv = noIV ? Buffer.alloc(IV_LENGTH, 0) : Buffer.from(ivHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");
  const key = await createHashAsync(keyText);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

export async function compare(
  originalText: string,
  encryptedText: string,
  keyText: string,
  noIV = false
): Promise<boolean> {
  if (!encryptedText || !originalText || !encryptedText.includes(":"))
    return false;

  return originalText === (await decrypt(encryptedText, keyText, noIV));
}

export async function encryptWithVault(
  text: string,
  transitPath: string = "transit",
  keyName: string = "database-encryption"
): Promise<string> {
  return vaultService.encryptWithTransit(text, transitPath, keyName);
}

export async function decryptWithVault(
  encryptedText: string,
  transitPath: string = "transit",
  keyName: string = "database-encryption"
): Promise<string> {
  return vaultService.decryptWithTransit(encryptedText, transitPath, keyName);
}
