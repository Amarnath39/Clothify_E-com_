import crypto from "crypto";

const algorithm = "aes-256-gcm";
const key = Buffer.from(process.env.TOTP_ENCRYPTION_KEY!, "hex");

export function encrypt(text: string) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("hex");
}

export function decrypt(hash: string) {
  const data = Buffer.from(hash, "hex");
  const iv = data.slice(0, 12);
  const tag = data.slice(12, 28);
  const text = data.slice(28);

  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(text) + decipher.final("utf8");
}
