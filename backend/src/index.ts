import express from "express";
import "dotenv/config";
import { FRONTEND_ORIGINS } from "./config/frontendOrigin.js";
import authRouter from "./routes/authRoutes.js";
import usersRouter from "./routes/userRoutes.js";
import reportsRouter from "./routes/reportRoutes.js";
import operatorsRouter from "./routes/operatorRoutes.js";

const app = express();

app.use((req, res, next) => {
  const origin = req.get("origin");
  if (origin && FRONTEND_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-File-Name");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

app.use("/", authRouter);
app.use("/users", usersRouter);
app.use("/reports", reportsRouter);
app.use("/operators", operatorsRouter);

app.listen(3000, "0.0.0.0", () => {
  console.log("O servidor está ativo!");
});
