import { Router } from "express";
import { RecordController } from "../controllers/record.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createRecordSchema, updateRecordSchema } from "../utils/validators";

const router = Router();

router.use(authenticate as any);

router.get(
  "/",
  authorize(["ADMIN", "ANALYST", "VIEWER"]) as any,
  RecordController.getAll as any
);
router.get(
  "/:id",
  authorize(["ADMIN", "ANALYST", "VIEWER"]) as any,
  RecordController.getById as any
);
router.post(
  "/",
  authorize(["ADMIN"]) as any,
  validate(createRecordSchema),
  RecordController.create as any
);
router.put(
  "/:id",
  authorize(["ADMIN"]) as any,
  validate(updateRecordSchema),
  RecordController.update as any
);
router.delete(
  "/:id",
  authorize(["ADMIN"]) as any,
  RecordController.delete as any
);

export default router;
