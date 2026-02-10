import crypto from "crypto";

const algorithm = "aes-256-gcm";
let key: Buffer;
try {
    key = Buffer.from(process.env.TOTP_ENCRYPTION_KEY || "", "hex");
    if (key.length !== 32) {
        console.warn("⚠️ TOTP_ENCRYPTION_KEY is missing or invalid. 2FA encryption will not work.");
    }
} catch (e) {
    console.error("❌ Error loading TOTP_ENCRYPTION_KEY:", e);
}

export function encrypt(text: string) {
    if (!key || key.length !== 32) {
        throw new Error("TOTP_ENCRYPTION_KEY is not configured correctly.");
    }
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, encrypted]).toString("hex");
}

export function decrypt(hash: string) {
    if (!key || key.length !== 32) {
        throw new Error("TOTP_ENCRYPTION_KEY is not configured correctly.");
    }
    const data = Buffer.from(hash, "hex");
    const iv = data.slice(0, 12);
    const tag = data.slice(12, 28);
    const text = data.slice(28);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    return decipher.update(text) + decipher.final("utf8");
}
