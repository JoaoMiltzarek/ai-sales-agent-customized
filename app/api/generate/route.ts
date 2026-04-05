import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import { NextResponse } from "next/server";
import { buildSalesPrompt, type SalesFormData } from "../../../lib/buildSalesPrompt";
import { buildFallbackResponse } from "../../../lib/buildFallbackResponse";
import { GenerateRequestSchema } from "../../../lib/schemas";

const OPENAI_MODEL = "gpt-5-mini";

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

  const result = GenerateRequestSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { errors: result.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const formData = result.data;
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
