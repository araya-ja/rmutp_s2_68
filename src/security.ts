import * as crypto from "crypto";

/**
 * Security utilities for field-level encryption.
 * Uses AES-256-CBC with key/iv provided via environment variables.
 * 
 * Required env:
 *  - CRYPTO_KEY: 32-byte key in hex (64 hex chars)
 *  - CRYPTO_IV:  16-byte IV in hex (32 hex chars)
 */

const ALG = "aes-256-cbc";

function getKey(): Buffer {
  const hex = process.env.CRYPTO_KEY || "";
  if (hex.length !== 64) {
    throw new Error("Invalid CRYPTO_KEY. Expected 64 hex chars for 32-byte key.");
  }
  return Buffer.from(hex, "hex");
}

function getIv(): Buffer {
  const hex = process.env.CRYPTO_IV || "";
  if (hex.length != 32) {
    throw new Error("Invalid CRYPTO_IV. Expected 32 hex chars for 16-byte iv.");
  }
  return Buffer.from(hex, "hex");
}

/** Encrypt a UTF-8 string -> Base64 ciphertext */
export function encrypt(plain: string): string {
  const cipher = crypto.createCipheriv(ALG, getKey(), getIv());
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return enc.toString("base64");
}

/** Decrypt a Base64 ciphertext -> UTF-8 string */
export function decrypt(cipherB64: string): string {
  const decipher = crypto.createDecipheriv(ALG, getKey(), getIv());
  const dec = Buffer.concat([decipher.update(Buffer.from(cipherB64, "base64")), decipher.final()]);
  return dec.toString("utf8");
}

export default { encrypt, decrypt };
