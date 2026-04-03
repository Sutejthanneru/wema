import mongoose from "mongoose";
import { PLAN_CONFIG } from "../constants/plans.js";

const policySchema = new mongoose.Schema(
  {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "RiderProfile", required: true },
    planKey: {
      type: String,
      enum: Object.keys(PLAN_CONFIG),
      required: true
    },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "CANCELLED"],
      default: "ACTIVE"
    },
    weeklyPremium: { type: Number, required: true },
    weeklyPayoutCap: { type: Number, required: true },
    autoRenew: { type: Boolean, default: false },
    coverageStart: { type: Date, required: true },
    coverageEnd: { type: Date, required: true },
    lastPaymentAt: { type: Date },
    nextRenewalAt: { type: Date },
    planSnapshot: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const Policy = mongoose.model("Policy", policySchema);

