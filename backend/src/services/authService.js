import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { RiderProfile } from "../models/RiderProfile.js";
import { ROLES } from "../constants/roles.js";
import { ApiError } from "../utils/ApiError.js";
import { buildCirclePolygon } from "../utils/geo.js";
import { cityFromPin, isValidPin, normalizePin } from "../utils/pincode.js";
import { normalizeCity } from "../utils/geography.js";

const cityDefaults = {
  Hyderabad: { lat: 17.4948, lng: 78.3996 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Kavali: { lat: 14.913, lng: 79.995 },
  Vijayawada: { lat: 16.5062, lng: 80.6480 },
  Visakhapatnam: { lat: 17.6868, lng: 83.2185 },
  Guntur: { lat: 16.3067, lng: 80.4365 },
  Tirupati: { lat: 13.6288, lng: 79.4192 },
  Nellore: { lat: 14.4426, lng: 79.9865 }
};

function buildDefaultEarningsHistory(referenceDate = new Date()) {
  const history = [];
  for (let week = 1; week <= 4; week += 1) {
    const slotStart = new Date(referenceDate);
    slotStart.setDate(slotStart.getDate() - week * 7);
    slotStart.setHours(14, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(18, 0, 0, 0);

    history.push({
      slotStart,
      slotEnd,
      orders: 8 + week,
      earnings: 480 + week * 35
    });
  }
  return history;
}

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

export async function loginWithFirebase(_idToken, profile = {}) {
  if (!profile.email && !profile.phone) {
    throw new ApiError(400, "Email or phone is required");
  }

  const requestedRole = profile.role || ROLES.RIDER;
  const lookupConditions = [
    ...(profile.email ? [{ email: profile.email }] : []),
    ...(profile.phone ? [{ phone: profile.phone }] : [])
  ];

  let user = lookupConditions.length ? await User.findOne({ $or: lookupConditions }) : null;

  if (!user) {
    if (requestedRole === ROLES.ADMIN) {
      throw new ApiError(403, "Admin accounts are created manually only");
    }

    const localIdentity = {
      uid: profile.email || profile.phone || `local-${Date.now()}`,
      email: profile.email,
      phone_number: profile.phone,
      name: profile.name || "New Rider"
    };

    user = await User.create({
      firebaseUid: localIdentity.uid,
      name: localIdentity.name,
      email: localIdentity.email,
      phone: localIdentity.phone_number,
      role: requestedRole,
      aadhaarVerified: Boolean(profile.aadhaarVerified),
      status: profile.aadhaarVerified ? "ACTIVE" : "PENDING_VERIFICATION"
    });
  } else {
    if (requestedRole === ROLES.ADMIN && user.role !== ROLES.ADMIN) {
      throw new ApiError(403, "This account does not have admin access");
    }

    if (requestedRole === ROLES.RIDER && user.role !== ROLES.RIDER) {
      throw new ApiError(403, "Use admin login for this account");
    }

    if (!user.firebaseUid) {
      user.firebaseUid = profile.email || profile.phone || `local-${user._id.toString()}`;
    }

    if (requestedRole === ROLES.ADMIN) {
      if (!profile.password) {
        throw new ApiError(400, "Admin password is required");
      }

      if (!user.passwordHash) {
        throw new ApiError(403, "Admin account is not password-enabled yet");
      }

      const passwordValid = await bcrypt.compare(profile.password, user.passwordHash);
      if (!passwordValid) {
        throw new ApiError(401, "Invalid admin credentials");
      }
    }

    user.name = profile.name || user.name;
    user.email = profile.email || user.email;
    user.phone = profile.phone || user.phone;
    if (typeof profile.aadhaarVerified === "boolean") {
      user.aadhaarVerified = profile.aadhaarVerified;
      user.status = profile.aadhaarVerified ? "ACTIVE" : user.status;
    }
    await user.save();
  }

  if (user.role === ROLES.RIDER) {
    const existingProfile = await RiderProfile.findOne({ userId: user._id });
    if (!existingProfile) {
      const normalizedPin = normalizePin(profile.zoneCode);
      const validPin = normalizedPin && isValidPin(normalizedPin);
      const derivedCity = validPin ? cityFromPin(normalizedPin) : null;
      const finalCity = normalizeCity(profile.city || derivedCity || "Hyderabad");
      const baseGps = profile.currentGps || cityDefaults[finalCity] || cityDefaults.Hyderabad;
      const zonePolygon = profile.registeredZonePolygon?.length
        ? profile.registeredZonePolygon
        : buildCirclePolygon(baseGps, 5);

      await RiderProfile.create({
        userId: user._id,
        provider: profile.provider || "ZOMATO",
        city: finalCity,
        zoneCode: validPin ? normalizedPin : "500001",
        registeredZonePolygon: zonePolygon,
        currentGps: baseGps,
        deviceFingerprint: profile.deviceFingerprint || "demo-device",
        upiId: profile.upiId || "demo@upi",
        weeklyEarningsAverage: profile.weeklyEarningsAverage || 3500,
        earningsHistory: profile.earningsHistory?.length ? profile.earningsHistory : buildDefaultEarningsHistory()
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
