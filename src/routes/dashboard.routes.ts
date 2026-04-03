import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate as any);

router.get(
  "/summary",
  authorize(["ADMIN", "ANALYST"]) as any,
  DashboardController.getSummary
);

export default router;
