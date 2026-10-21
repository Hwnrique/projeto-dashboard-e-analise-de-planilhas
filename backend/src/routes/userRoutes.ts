import { Router } from "express";
import UserController from "../controllers/UserController.js";
import { checkAuth } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/adminMiddleware.js";

const usersRouter = Router();

usersRouter.get("/me", checkAuth, UserController.me);
usersRouter.get("/", checkAuth, requireAdmin, UserController.list);
usersRouter.put("/:id", checkAuth, UserController.update);
usersRouter.delete("/:id", checkAuth, requireAdmin, UserController.remove);

export default usersRouter;
