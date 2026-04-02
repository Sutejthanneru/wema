import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    claimId: { type: mongoose.Schema.Types.ObjectId, ref: "Claim", required: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "RiderProfile", required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    method: { type: String, enum: ["UPI"], default: "UPI" },
    provider: { type: String, enum: ["RAZORPAY"], default: "RAZORPAY" },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PAID", "FAILED"],
      default: "PENDING"
    },
    providerReference: { type: String },
    paidAt: { type: Date },
    failureReason: { type: String }
  },
  { timestamps: true }
);

export const Payout = mongoose.model("Payout", payoutSchema);

