import { Router } from "express";
import { dashboard, decideTrigger, reviewClaimDecision } from "../controllers/adminController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.use(verifyToken, requireRole(ROLES.ADMIN));
router.get("/dashboard", dashboard);
router.patch("/social-triggers/:eventId/decision", decideTrigger);
router.patch("/claims/:claimId/review", reviewClaimDecision);

export default router;

