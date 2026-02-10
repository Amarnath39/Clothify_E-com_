// import { connectDB } from "../../../../../db";
// import Admin from "../../../../../src/model/Admin";
// import { decrypt } from "../../../../../src/lib/encryption";
// import { verifyToken } from "../../../../../src/lib/twofa";
// import { verifyAdmin } from "../../../../../src/lib/auth";

// export default async function handler(req, res) {
//   await connectDB();
//   const { token } = req.body;
//   const user = verifyAdmin(req);

//   const admin = await Admin.findById(user.id);
//   const secret = decrypt(admin.twoFA.tempSecret);

//   const valid = verifyToken(secret, token);
//   if (!valid) return res.status(400).json({ msg: "Invalid OTP" });

//   admin.twoFA.secret = admin.twoFA.tempSecret;
//   admin.twoFA.tempSecret = null;
//   admin.twoFA.enabled = true;
//   await admin.save();

//   res.json({ msg: "2FA enabled" });
// }
