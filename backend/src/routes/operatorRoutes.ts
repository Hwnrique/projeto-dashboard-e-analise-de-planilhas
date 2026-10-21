import { Router } from "express";
import OperatorController from "../controllers/OperatorController.js";
import { checkAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { validacao } from "../middleware/validacao.js";
import { operatorSchema } from "../schemas/operatorSchema.js";

const operatorsRouter = Router();

operatorsRouter.get("/", checkAuth, OperatorController.list);
operatorsRouter.post("/", checkAuth, requireAdmin, validacao(operatorSchema), OperatorController.save);

export default operatorsRouter;
