import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.AADHAR_ENCRYPTION_KEY;
  if (!key) throw new Error("AADHAR_ENCRYPTION_KEY not set");
  // Ensure key is exactly 32 bytes
  return crypto.createHash("sha256").update(key).digest();
}

export function encryptAadhar(aadhar: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(aadhar, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptAadhar(encryptedAadhar: string): string {
  const [ivHex, encrypted] = encryptedAadhar.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

export function maskAadhar(aadhar: string): string {
  // Show only last 4 digits: XXXX-XXXX-1234
  const last4 = aadhar.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

export function getMaskedFromEncrypted(encryptedAadhar: string): string {
  const decrypted = decryptAadhar(encryptedAadhar);
  return maskAadhar(decrypted);
}
