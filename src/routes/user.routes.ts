import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createUserSchema,
  updateRoleSchema,
  updateStatusSchema,
} from "../utils/validators";

const router = Router();

router.use(authenticate as any);
router.use(authorize(["ADMIN"]) as any);

router.get("/", UserController.getAll);
router.post("/", validate(createUserSchema), UserController.create);
router.put("/:id/role", validate(updateRoleSchema), UserController.updateRole);
router.put("/:id/status", validate(updateStatusSchema), UserController.updateStatus);

export default router;
