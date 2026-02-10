import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function generateSecret(email: string) {
  const secret = speakeasy.generateSecret({
    length: 32,
    name: `MyAdminPanel:${email}`,
  });

  const qr = await QRCode.toDataURL(secret.otpauth_url!);

  return { base32: secret.base32, qr };
}

export function verifyToken(secret: string, token: string) {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 1,
  });
}
