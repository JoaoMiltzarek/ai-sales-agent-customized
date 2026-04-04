"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { buildSalesPrompt, type SalesFormData } from "../lib/buildSalesPrompt";
import { buildFallbackResponse } from "../lib/buildFallbackResponse";

type SalesFormErrors = Partial<Record<keyof SalesFormData, string>>;
type GenerateResponsePayload = {
  prompt?: string;
  responseText?: string;
  error?: string;
  source?: "openai" | "fallback";
  notice?: string;
};

const businessTypeOptions = [
  { value: "restaurante", label: "Restaurante" },
  { value: "oficina", label: "Oficina" },
  { value: "clinica", label: "Clinica" },
  { value: "pet shop", label: "Pet shop" },
  { value: "outro", label: "Outro" },
];

const toneOptions = [
  { value: "profissional", label: "Profissional" },
  { value: "amigavel", label: "Amigavel" },
  { value: "direto", label: "Direto" },
  { value: "premium", label: "Premium" },
];

const initialFormData: SalesFormData = {
  businessType: "",
  companyName: "",
  tone: "",
  objective: "",
  customerMessage: "",
};

const summaryFields = [
  {
    key: "businessType",
    label: "Tipo de negocio",
  },
  {
    key: "companyName",
    label: "Nome da empresa",
  },
  {
    key: "tone",
    label: "Tom de voz",
  },
  {
    key: "objective",
    label: "Objetivo da resposta",
  },
] as const;

const heroSignals = [
  {
    label: "Fluxo",
    value: "Formulario, prompt e resposta",
    description: "Tudo na mesma tela.",
  },
  {
    label: "Seguranca",
    value: "API key protegida no servidor",
    description: "Nada sensivel no frontend.",
  },
  {
    label: "Fallback",
    value: "Resposta local quando a API falha",
    description: "O sistema continua util.",
  },
];

const pipelineStages = [
  {
    title: "Formulario",
    text: "Capta contexto e objetivo.",
  },
  {
    title: "Prompt",
    text: "Monta a instrucao interna.",
  },
  {
    title: "Resposta",
    text: "Entrega a saida final.",
  },
];

function getOptionLabel(
  value: string,
  options: Array<{ value: string; label: string }>,
) {
  return options.find((option) => option.value === value)?.label ?? value;
}

function validateForm(data: SalesFormData) {
  const errors: SalesFormErrors = {};

  if (!data.businessType) {
    errors.businessType = "Selecione o tipo de negocio.";
  }

  if (!data.companyName.trim()) {
    errors.companyName = "Informe o nome da empresa.";
  }

  if (!data.tone) {
    errors.tone = "Selecione o tom de voz.";
  }

  if (!data.objective.trim()) {
    errors.objective = "Informe o objetivo da resposta.";
  }

  if (!data.customerMessage.trim()) {
    errors.customerMessage = "Escreva a mensagem do cliente.";
  }

  return errors;
}

export default function Home() {
  const [formData, setFormData] = useState<SalesFormData>(initialFormData);
  const [errors, setErrors] = useState<SalesFormErrors>({});
  const [submittedData, setSubmittedData] = useState<SalesFormData | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [generatedResponse, setGeneratedResponse] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [responseSource, setResponseSource] = useState<
    "openai" | "fallback" | null
  >(null);
  const [responseNotice, setResponseNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;

    setFormData((currentData) => ({
      ...currentData,
      [name]: value,
    }));

    if (errors[name as keyof SalesFormData]) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [name]: undefined,
      }));
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmittedData(null);
      setGeneratedPrompt(null);
      setGeneratedResponse(null);
      setApiError(null);
      setResponseSource(null);
      setResponseNotice(null);
      return;
    }

    const cleanFormData = {
      businessType: formData.businessType,
      companyName: formData.companyName.trim(),
      tone: formData.tone,
      objective: formData.objective.trim(),
      customerMessage: formData.customerMessage.trim(),
    };

    setErrors({});
    setSubmittedData(cleanFormData);
    setGeneratedPrompt(buildSalesPrompt(cleanFormData));
    setGeneratedResponse(null);
    setApiError(null);
    setResponseSource(null);
    setResponseNotice(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cleanFormData),
      });

      const payload = (await response.json().catch(() => null)) as
        | GenerateResponsePayload
        | null;

      if (!response.ok) {
        setGeneratedPrompt(payload?.prompt ?? buildSalesPrompt(cleanFormData));
        setGeneratedResponse(null);
        setApiError(
          payload?.error ?? "Nao foi possivel gerar a resposta agora.",
        );
        setResponseSource(null);
        setResponseNotice(null);
        return;
      }

      setGeneratedPrompt(payload?.prompt ?? buildSalesPrompt(cleanFormData));
      setGeneratedResponse(payload?.responseText ?? null);
      setApiError(null);
      setResponseSource(payload?.source ?? "openai");
      setResponseNotice(payload?.notice ?? null);
    } catch {
      const prompt = buildSalesPrompt(cleanFormData);

      setGeneratedPrompt(prompt);
      setGeneratedResponse(buildFallbackResponse(cleanFormData, prompt));
      setApiError(null);
      setResponseSource("fallback");
      setResponseNotice(
        "Resposta local gerada porque a rota nao conseguiu concluir a chamada.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  const inputClassName = "field-control";
  const selectClassName = `${inputClassName} field-control-select`;
  const textAreaClassName = `${inputClassName} field-control-textarea`;
  const pipelineState = [
    true,
    Boolean(generatedPrompt),
    Boolean(generatedResponse || apiError || isLoading),
  ];
  const responseCardClassName = `panel-shell panel-soft response-panel p-6 sm:p-8${
    generatedResponse || apiError || isLoading
      ? " response-panel-active surface-reveal"
      : ""
  }`;

  return (
    <main className="min-h-screen overflow-hidden">
      <div className="background-grid" />
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />
      <div className="background-noise" />

      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-12 px-4 py-7 sm:px-6 sm:py-10 lg:px-10 lg:py-12">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-12">
          <aside className="space-y-8 animate-enter lg:sticky lg:top-8">
            <div className="hero-shell">
              <span className="eyebrow eyebrow-glow">AI sales agent customized</span>

              <div className="space-y-5">
                <p className="hero-kicker">Ferramenta simples para portfolio</p>
                <h1 className="max-w-xl text-4xl font-semibold tracking-[-0.07em] text-[var(--foreground)] sm:text-5xl lg:text-[3.85rem] lg:leading-[1]">
                  Respostas comerciais prontas para usar.
                </h1>
                <p className="max-w-lg text-[15px] leading-8 text-[var(--muted)] sm:text-base">
                  Uma interface clara para preencher o contexto, revisar o
                  prompt e gerar uma resposta comercial no mesmo fluxo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="mini-chip mini-chip-quiet">OpenAI</span>
                <span className="mini-chip mini-chip-quiet">Prompt local</span>
                <span className="mini-chip mini-chip-quiet">Fallback local</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {heroSignals.map((signal) => (
                <div key={signal.label} className="signal-card">
                  <p className="metric-label">{signal.label}</p>
                  <p className="metric-value">{signal.value}</p>
                  <p className="metric-copy">{signal.description}</p>
                </div>
              ))}
            </div>
          </aside>

          <div className="space-y-8 animate-enter-delayed">
            <div className="panel-shell panel-elevated p-7 sm:p-9">
              <div className="space-y-10">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-2xl space-y-4">
                    <span className="status-badge status-badge-soft">
                      Workspace de geracao
                    </span>
                    <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-[2.15rem]">
                      Formulario, prompt e resposta em um pipeline unico.
                    </h2>
                    <p className="text-sm leading-7 text-[var(--muted)] sm:text-base">
                      Um fluxo simples de produto, com boa leitura e sem
                      elementos extras fora do que importa.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="mini-chip">Clareza</span>
                    <span className="mini-chip">Estrutura</span>
                    <span className="mini-chip">Produto real</span>
                  </div>
                </div>

                <div className="pipeline-strip" aria-label="Fluxo do produto">
                  {pipelineStages.map((stage, index) => (
                    <div
                      key={stage.title}
                      className={`pipeline-node${
                        pipelineState[index] ? " pipeline-node-active" : ""
                      }`}
                    >
                      <span className="pipeline-node-index">0{index + 1}</span>
                      <div className="space-y-1">
                        <p className="pipeline-node-title">{stage.title}</p>
                        <p className="pipeline-node-copy">{stage.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <form className="space-y-8" onSubmit={handleSubmit} noValidate>
                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="field-block">
                      <span className="field-label">Tipo de negocio</span>
                      <span className="field-hint">
                        Define o contexto da resposta comercial.
                      </span>
                      <select
                        name="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.businessType)}
                        className={selectClassName}
                      >
                        <option value="">Selecione uma opcao</option>
                        {businessTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.businessType ? (
                        <span className="field-error">{errors.businessType}</span>
                      ) : null}
                    </label>

                    <label className="field-block">
                      <span className="field-label">Nome da empresa</span>
                      <span className="field-hint">
                        Aparece na personalizacao e no fallback local.
                      </span>
                      <input
                        type="text"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        placeholder="Exemplo: Studio Vendas"
                        aria-invalid={Boolean(errors.companyName)}
                        className={inputClassName}
                      />
                      {errors.companyName ? (
                        <span className="field-error">{errors.companyName}</span>
                      ) : null}
                    </label>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <label className="field-block">
                      <span className="field-label">Tom de voz</span>
                      <span className="field-hint">
                        Ajusta o estilo da resposta final.
                      </span>
                      <select
                        name="tone"
                        value={formData.tone}
                        onChange={handleChange}
                        aria-invalid={Boolean(errors.tone)}
                        className={selectClassName}
                      >
                        <option value="">Selecione uma opcao</option>
                        {toneOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {errors.tone ? (
                        <span className="field-error">{errors.tone}</span>
                      ) : null}
                    </label>

                    <label className="field-block">
                      <span className="field-label">Objetivo da resposta</span>
                      <span className="field-hint">
                        Exemplo: marcar reuniao, fechar pedido ou tirar duvida.
                      </span>
                      <input
                        type="text"
                        name="objective"
                        value={formData.objective}
                        onChange={handleChange}
                        placeholder="Exemplo: marcar uma reuniao"
                        aria-invalid={Boolean(errors.objective)}
                        className={inputClassName}
                      />
                      {errors.objective ? (
                        <span className="field-error">{errors.objective}</span>
                      ) : null}
                    </label>
                  </div>

                  <label className="field-block">
                    <span className="field-label">Mensagem do cliente</span>
                    <span className="field-hint">
                      Cole a mensagem original para gerar uma resposta mais util.
                    </span>
                    <textarea
                      name="customerMessage"
                      value={formData.customerMessage}
                      onChange={handleChange}
                      placeholder="Cole aqui a mensagem recebida do cliente."
                      aria-invalid={Boolean(errors.customerMessage)}
                      className={textAreaClassName}
                    />
                    {errors.customerMessage ? (
                      <span className="field-error">
                        {errors.customerMessage}
                      </span>
                    ) : null}
                  </label>

                  <div className="panel-divider flex flex-col gap-5 pt-8 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--foreground)]">
                        Pronto para gerar
                      </p>
                      <p className="text-sm leading-7 text-[var(--muted)]">
                        O envio monta o prompt, chama a rota e devolve a
                        resposta na mesma tela.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="button-primary min-w-[220px]"
                    >
                      <span
                        className={`button-dot${
                          isLoading ? " button-dot-loading" : ""
                        }`}
                      />
                      {isLoading ? "Gerando resposta..." : "Gerar resposta"}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {submittedData ? (
              <div className="space-y-7">
                <div className="panel-shell panel-soft p-7 sm:p-9">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-3">
                      <span className="status-badge status-badge-soft">
                        Entrada capturada
                      </span>
                      <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-[1.9rem]">
                        Resumo do envio
                      </h3>
                      <p className="text-sm leading-7 text-[var(--muted)] sm:text-base">
                        Os dados principais ficam organizados antes do prompt e
                        da resposta final.
                      </p>
                    </div>

                    <span className="mini-chip mini-chip-quiet">
                      Revisao rapida
                    </span>
                  </div>

                  <div className="summary-grid mt-7">
                    {summaryFields.map((field) => (
                      <div key={field.key} className="summary-item">
                        <p className="summary-label">{field.label}</p>
                        <p className="summary-value">
                          {field.key === "businessType"
                            ? getOptionLabel(
                                submittedData.businessType,
                                businessTypeOptions,
                              )
                            : field.key === "tone"
                              ? getOptionLabel(submittedData.tone, toneOptions)
                              : submittedData[field.key]}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="summary-message mt-6">
                    <p className="summary-label">Mensagem do cliente</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-8 text-[var(--foreground)] sm:text-base">
                      {submittedData.customerMessage}
                    </p>
                  </div>
                </div>

                <div className="panel-shell panel-dark p-7 sm:p-9">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-3">
                      <span className="status-badge status-badge-dark">
                        Prompt gerado
                      </span>
                      <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-[1.9rem]">
                        Base interna usada na geracao
                      </h3>
                      <p className="text-sm leading-7 text-[var(--muted)] sm:text-base">
                        O prompt abaixo mostra como o sistema organizou o
                        contexto antes de gerar a resposta.
                      </p>
                    </div>

                    <span className="mini-chip mini-chip-dark">Regra local</span>
                  </div>

                  <pre className="prompt-window">{generatedPrompt}</pre>
                </div>

                <div className={responseCardClassName}>
                  <div className="mx-auto w-full max-w-[720px] space-y-3">
                    <div className="space-y-2">
                      <span className="status-badge status-badge-soft">
                        Resposta final
                      </span>
                      <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)] sm:text-[2rem]">
                        Saida pronta para revisar
                      </h3>
                    </div>
                  </div>

                  {apiError ? (
                    <div className="error-surface mx-auto mt-7 w-full max-w-[720px] rounded-[1.75rem] p-7 shadow-[0_14px_36px_rgba(15,23,42,0.06)] sm:mt-8 sm:p-8">
                      {apiError}
                    </div>
                  ) : generatedResponse ? (
                    <div
                      className="response-surface mx-auto mt-7 w-full max-w-[720px] rounded-[1.75rem] p-7 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:mt-8 sm:p-8"
                      aria-live="polite"
                    >
                      <p className="whitespace-pre-wrap text-left text-[15px] leading-[1.68] text-[var(--foreground)] sm:text-base sm:leading-[1.68]">
                        {generatedResponse}
                      </p>
                    </div>
                  ) : (
                    <div className="empty-surface mx-auto mt-7 w-full max-w-[720px] rounded-[1.75rem] p-7 shadow-[0_12px_30px_rgba(15,23,42,0.05)] sm:mt-8 sm:p-8">
                      {isLoading
                        ? "A resposta esta sendo gerada."
                        : "A resposta aparecera aqui depois do envio."}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
