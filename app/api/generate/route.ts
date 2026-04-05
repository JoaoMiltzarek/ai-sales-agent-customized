import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import {
  buildSalesPrompt,
  type SalesFormData,
} from "../../../lib/buildSalesPrompt";
import { buildFallbackResponse } from "../../../lib/buildFallbackResponse";

const OPENAI_MODEL = "gpt-5-mini";

function isFilledString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function sanitizeSalesFormData(value: unknown): SalesFormData | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const data = value as Partial<SalesFormData>;

  if (
    !isFilledString(data.businessType) ||
    !isFilledString(data.companyName) ||
    !isFilledString(data.tone) ||
    !isFilledString(data.objective) ||
    !isFilledString(data.customerMessage)
  ) {
    return null;
  }

  return {
    businessType: data.businessType.trim(),
    companyName: data.companyName.trim(),
    tone: data.tone.trim(),
    objective: data.objective.trim(),
    customerMessage: data.customerMessage.trim(),
  };
}

function createFallbackResult(formData: SalesFormData, prompt: string) {
  return NextResponse.json({
    prompt,
    responseText: buildFallbackResponse(formData, prompt),
    source: "fallback",
    notice: "Resposta gerada localmente porque a OpenAI nao respondeu.",
  });
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Nao foi possivel ler os dados enviados." },
      { status: 400 },
    );
  }

  const formData = sanitizeSalesFormData(body);

  if (!formData) {
    return NextResponse.json(
      { error: "Preencha todos os campos principais antes de enviar." },
      { status: 400 },
    );
  }

  const prompt = buildSalesPrompt(formData);

  if (!process.env.OPENAI_API_KEY) {
    return createFallbackResult(formData, prompt);
  }

  try {
    const result = streamText({
      model: openai(OPENAI_MODEL),
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Erro ao gerar resposta com OpenAI:", error);

    return createFallbackResult(formData, prompt);
  }
}
