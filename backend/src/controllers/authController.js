import { asyncHandler } from "../utils/asyncHandler.js";
import { getProfile, loginWithFirebase } from "../services/authService.js";

export const firebaseLogin = asyncHandler(async (req, res) => {
  const result = await loginWithFirebase(req.body.idToken, req.body.profile);
  res.json({ success: true, data: result });
});

export const me = asyncHandler(async (req, res) => {
  const result = await getProfile(req.auth.userId);
  res.json({ success: true, data: result });
});

