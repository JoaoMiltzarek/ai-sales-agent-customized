import { z } from "zod";

export const generateRequestMessages = {
  businessType: "Selecione o tipo de negocio.",
  companyName: "Informe o nome da empresa.",
  tone: "Selecione o tom de voz.",
  objective: "Informe o objetivo da resposta.",
  customerMessage: "Escreva a mensagem do cliente.",
} as const;

export const GenerateRequestSchema = z.object({
  businessType: z
    .string({ error: generateRequestMessages.businessType })
    .trim()
    .min(1, { message: generateRequestMessages.businessType }),
  companyName: z
    .string({ error: generateRequestMessages.companyName })
    .trim()
    .min(1, { message: generateRequestMessages.companyName }),
  tone: z
    .string({ error: generateRequestMessages.tone })
    .trim()
    .min(1, { message: generateRequestMessages.tone }),
  objective: z
    .string({ error: generateRequestMessages.objective })
    .trim()
    .min(1, { message: generateRequestMessages.objective }),
  customerMessage: z
    .string({ error: generateRequestMessages.customerMessage })
    .trim()
    .min(1, { message: generateRequestMessages.customerMessage }),
});

export type GenerateRequest = z.infer<typeof GenerateRequestSchema>;
