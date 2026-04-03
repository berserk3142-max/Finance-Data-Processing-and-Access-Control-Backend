import { Response, NextFunction } from "express";
import { RecordService } from "../services/record.service";
import { AuthRequest } from "../middleware/auth.middleware";

export class RecordController {
  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await RecordService.create({
        ...req.body,
        createdById: req.user!.id,
      });
      res.status(201).json(record);
    } catch (error) {
      next(error);
    }
  }

  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await RecordService.getAll(req.query as any);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await RecordService.getById(req.params.id);
      res.json(record);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const record = await RecordService.update(req.params.id, req.body);
      res.json(record);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await RecordService.softDelete(req.params.id);
      res.json({ message: "Record deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
