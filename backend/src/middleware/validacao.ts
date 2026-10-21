import type { ZodSchema } from "zod";
import type { Request, Response, NextFunction } from "express";

export const validacao = (schema: ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const resultado = schema.safeParse(req.body);
        if(!resultado.success) {
            return res.status(400).json({message: "Preencha os campos corretamente!"})
        }

        req.body = resultado.data;

        next();
    }
}
