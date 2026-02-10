// import { connectDB } from "../../../../../db";
// import Admin from "../../../../../src/model/Admin";
// import { generateSecret } from "../../../../../src/lib/twofa";
// import { encrypt } from "../../../../../src/lib/encryption";
// import { verifyAdmin } from "../../../../../src/lib/auth";

// export default async function handler(req, res) {
//   await connectDB();
//   const user = verifyAdmin(req);

//   const admin = await Admin.findById(user.id);
//   const { base32, qr } = await generateSecret(admin.email);

//   admin.twoFA.tempSecret = encrypt(base32);
//   await admin.save();

//   res.json({ qr, manualKey: base32 });
// }
