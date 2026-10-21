import type { Request, Response } from "express";
import { listOperators, saveOperator } from "../models/Operator.js";
import type { OperatorInput } from "../schemas/operatorSchema.js";

export default class OperatorController {
  static list(_req: Request, res: Response) {
    return res.json(listOperators());
  }

  static save(req: Request, res: Response) {
    const operator = saveOperator(req.body as OperatorInput);
    return res.status(200).json({
      message: "Operador salvo com sucesso",
      operator,
    });
  }
}
