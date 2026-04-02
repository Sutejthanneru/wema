import { Router } from "express";
import { appeal, alerts, dashboard, payouts, selectPlan } from "../controllers/riderController.js";
import { verifyToken } from "../middleware/verifyToken.js";
import { requireRole } from "../middleware/requireRole.js";
import { ROLES } from "../constants/roles.js";

const router = Router();

router.use(verifyToken, requireRole(ROLES.RIDER));
router.get("/dashboard", dashboard);
router.post("/plan", selectPlan);
router.get("/alerts", alerts);
router.get("/payouts", payouts);
router.post("/appeals", appeal);

export default router;

