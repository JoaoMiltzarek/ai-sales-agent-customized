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
  const fallbackText = buildFallbackResponse(formData, prompt);

  if (!process.env.OPENAI_API_KEY) {
    return createFallbackResult(formData, prompt);
  }

  try {
    const result = streamText({
      model: openai(OPENAI_MODEL),
      prompt,
      onError({ error }) {
        console.error("Erro ao gerar resposta com OpenAI:", error);
      },
    });

    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let emittedText = false;

        const sendFallback = () => {
          controller.enqueue(encoder.encode(fallbackText));
          emittedText = true;
        };

        try {
          for await (const part of result.fullStream) {
            if (part.type === "text-delta" && part.text) {
              emittedText = true;
              controller.enqueue(encoder.encode(part.text));
            }

            if (part.type === "error") {
              console.error("Erro ao gerar resposta com OpenAI:", part.error);

              if (!emittedText) {
                sendFallback();
              }

              return;
            }
          }

          if (!emittedText) {
            sendFallback();
          }
        } catch (error) {
          console.error("Erro ao gerar resposta com OpenAI:", error);

          if (!emittedText) {
            sendFallback();
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar resposta com OpenAI:", error);

    return createFallbackResult(formData, prompt);
  }
}
