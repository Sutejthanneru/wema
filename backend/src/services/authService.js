import jwt from "jsonwebtoken";
import { getFirebaseAdmin } from "../config/firebase.js";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { RiderProfile } from "../models/RiderProfile.js";
import { ROLES } from "../constants/roles.js";

function signToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );
}

export async function loginWithFirebase(idToken, profile = {}) {
  const firebaseAdmin = getFirebaseAdmin();
  let firebaseUser;
  let user;

  if (firebaseAdmin) {
    firebaseUser = await firebaseAdmin.auth().verifyIdToken(idToken);
    user = await User.findOne({ firebaseUid: firebaseUser.uid });
  } else {
    firebaseUser = {
      uid: profile.firebaseUid || profile.email || profile.phone || `dev-${profile.role || "RIDER"}`,
      email: profile.email,
      phone_number: profile.phone,
      name: profile.name || "Demo Rider"
    };

    user = await User.findOne({
      $or: [
        ...(profile.email ? [{ email: profile.email }] : []),
        ...(profile.phone ? [{ phone: profile.phone }] : []),
        ...(profile.firebaseUid ? [{ firebaseUid: profile.firebaseUid }] : [])
      ]
    });
  }

  if (!user) {
    user = await User.create({
      firebaseUid: firebaseUser.uid,
      name: firebaseUser.name || profile.name || "New User",
      email: firebaseUser.email || profile.email,
      phone: firebaseUser.phone_number || profile.phone,
      role: profile.role || ROLES.RIDER,
      aadhaarVerified: Boolean(profile.aadhaarVerified),
      status: profile.aadhaarVerified ? "ACTIVE" : "PENDING_VERIFICATION"
    });
  } else if (!user.firebaseUid) {
    user.firebaseUid = firebaseUser.uid;
    user.name = profile.name || user.name;
    user.email = profile.email || user.email;
    user.phone = profile.phone || user.phone;
    if (profile.role) {
      user.role = profile.role;
    }
    if (typeof profile.aadhaarVerified === "boolean") {
      user.aadhaarVerified = profile.aadhaarVerified;
      user.status = profile.aadhaarVerified ? "ACTIVE" : user.status;
    }
    await user.save();
  }

  if (user.role === ROLES.RIDER) {
    const existingProfile = await RiderProfile.findOne({ userId: user._id });
    if (!existingProfile) {
      await RiderProfile.create({
        userId: user._id,
        provider: profile.provider || "ZOMATO",
        city: profile.city || "Hyderabad",
        zoneCode: profile.zoneCode || "HYD-KUKATPALLY",
        registeredZonePolygon: profile.registeredZonePolygon || [],
        currentGps: profile.currentGps || { lat: 17.4948, lng: 78.3996 },
        deviceFingerprint: profile.deviceFingerprint || "demo-device",
        upiId: profile.upiId || "demo@upi"
      });
    }
  }

  return {
    user,
    token: signToken(user)
  };
}

export async function getProfile(userId) {
  const user = await User.findById(userId).lean();
  const riderProfile = user?.role === ROLES.RIDER ? await RiderProfile.findOne({ userId }).lean() : null;
  return { user, riderProfile };
}
