import express, { Router } from "express";
import ReportController from "../controllers/ReportController.js";
import { checkAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const reportsRouter = Router();

reportsRouter.get("/:kind/latest", checkAuth, ReportController.latest);
reportsRouter.put("/:kind/goal", checkAuth, requireAdmin, ReportController.updateGoal);
reportsRouter.post(
  "/:kind",
  checkAuth,
  requireAdmin,
  express.raw({ type: "application/octet-stream", limit: "20mb" }),
  ReportController.upload,
);

export default reportsRouter;
