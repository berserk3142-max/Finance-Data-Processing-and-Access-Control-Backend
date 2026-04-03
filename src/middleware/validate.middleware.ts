import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "./error.middleware";

export const validate = (schema: ZodSchema, source: "body" | "query" = "body") => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(source === "body" ? req.body : req.query);

    if (!result.success) {
      const details = result.error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return next(new AppError("Invalid input", 400, details));
    }

    if (source === "body") {
      req.body = result.data;
    }

    next();
  };
};
