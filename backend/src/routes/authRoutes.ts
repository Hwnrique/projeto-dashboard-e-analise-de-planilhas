import { Router } from "express";
import AuthController from "../controllers/AuthController.js";
import { validacao } from "../middleware/validacao.js";
import { cadastroSchema, loginSchema } from "../schemas/authSchema.js";
import { checkAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";
import { requireFrontendOrigin } from "../middleware/requireFrontendOrigin.js";

const authRouter = Router();

authRouter.post("/cadastro", checkAuth, requireAdmin, validacao(cadastroSchema), AuthController.cadastro);
authRouter.post("/login", validacao(loginSchema), AuthController.login);
authRouter.post("/refresh", requireFrontendOrigin, AuthController.refresh);
authRouter.post("/logout", requireFrontendOrigin, AuthController.logout);

export default authRouter;
