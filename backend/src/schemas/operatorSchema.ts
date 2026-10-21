import { z } from "zod";

export const operatorSchema = z.object({
  code: z.string().trim().min(1).max(40),
  fullName: z.string().trim().min(2).max(160),
});

export type OperatorInput = z.infer<typeof operatorSchema>;
