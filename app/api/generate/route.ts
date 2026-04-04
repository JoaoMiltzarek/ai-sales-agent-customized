import { NextResponse } from "next/server";
import {
  buildSalesPrompt,
  type SalesFormData,
} from "../../../lib/buildSalesPrompt";
import { buildFallbackResponse } from "../../../lib/buildFallbackResponse";

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const OPENAI_MODEL = "gpt-5-mini";

type OpenAIErrorPayload = {
  error?: {
    message?: string;
  };
};

type OpenAIResponsePayload = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

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

function extractResponseText(payload: OpenAIResponsePayload) {
  if (typeof payload.output_text === "string" && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload.output)) {
    return "";
  }

  return payload.output
    .flatMap((item) => item.content ?? [])
    .filter(
      (item): item is { type: string; text: string } =>
        item.type === "output_text" && typeof item.text === "string",
    )
    .map((item) => item.text)
    .join("\n")
    .trim();
}

function isOpenAIResponsePayload(
  payload: OpenAIResponsePayload | OpenAIErrorPayload | null,
): payload is OpenAIResponsePayload {
  return Boolean(payload && ("output_text" in payload || "output" in payload));
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
    const openAIResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: prompt,
      }),
    });

    const payload = (await openAIResponse.json().catch(() => null)) as
      | OpenAIResponsePayload
      | OpenAIErrorPayload
      | null;

    if (!openAIResponse.ok) {
      console.warn(
        "OpenAI retornou erro, usando fallback local:",
        payload &&
          "error" in payload &&
          typeof payload.error?.message === "string"
          ? payload.error.message
          : openAIResponse.status,
      );

      return createFallbackResult(formData, prompt);
    }

    const responseText = isOpenAIResponsePayload(payload)
      ? extractResponseText(payload)
      : "";

    if (!responseText) {
      console.warn(
        "OpenAI nao retornou texto utilizavel, usando fallback local.",
      );

      return createFallbackResult(formData, prompt);
    }

    return NextResponse.json({
      prompt,
      responseText,
      source: "openai",
    });
  } catch (error) {
    console.error("Erro ao gerar resposta com OpenAI:", error);

    return createFallbackResult(formData, prompt);
  }
}
