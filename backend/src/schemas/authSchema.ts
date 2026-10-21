import {z} from "zod";

export const cadastroSchema = z.object({
    nome: z.string(),
    login: z.string().min(6),
    senha: z.string().min(6),
})

export const loginSchema = z.object({
    login: z.string().min(6),
    senha: z.string().min(6)
})

export type Cadastro = z.infer<typeof cadastroSchema>
export type Login = z.infer<typeof loginSchema>
