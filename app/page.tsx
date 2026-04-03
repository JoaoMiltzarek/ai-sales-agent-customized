"use client";

import { ChangeEvent, FormEvent, useState } from "react";

type SalesFormData = {
  businessType: string;
  companyName: string;
  tone: string;
  objective: string;
  customerMessage: string;
};

type SalesFormErrors = Partial<Record<keyof SalesFormData, string>>;

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationErrors = validateForm(formData);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmittedData(null);
      return;
    }

    setErrors({});
    setSubmittedData({
      businessType: formData.businessType,
      companyName: formData.companyName.trim(),
      tone: formData.tone,
      objective: formData.objective.trim(),
      customerMessage: formData.customerMessage.trim(),
    });
  }

  const inputClassName =
    "mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/75 px-4 py-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:bg-white";

  const textAreaClassName = `${inputClassName} min-h-36 resize-y`;

  return (
    <main className="min-h-screen overflow-hidden">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-14 px-6 py-16 lg:flex-row lg:items-start lg:gap-20 lg:px-10">
        <div className="flex max-w-xl flex-col gap-6 animate-enter lg:sticky lg:top-16">
          <p className="font-serif text-lg italic text-[var(--accent)]">
            MVP para portfolio
          </p>

          <div className="space-y-4">
            <span className="inline-flex w-fit items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              ai-sales-agent-customized
            </span>

            <h1 className="max-w-lg text-4xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Monte respostas comerciais personalizadas em poucos campos.
            </h1>

            <p className="max-w-lg text-base leading-7 text-[var(--muted)] sm:text-lg">
              Preencha os dados principais do negocio e da conversa para
              organizar a resposta ideal antes da integracao com a API.
            </p>
          </div>

          <div className="grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2">
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                Etapa atual
              </p>
              <p className="mt-2 leading-6">
                Formulario principal com validacao basica e visual de resultado.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[var(--line)] bg-white/45 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                Proximo passo
              </p>
              <p className="mt-2 leading-6">
                Conectar a geracao da resposta sem aumentar a complexidade do
                MVP.
              </p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-2xl animate-enter-delayed">
          <div className="placeholder-panel">
            <div className="space-y-3">
              <span className="inline-flex w-fit rounded-full border border-[var(--line)] bg-white/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Formulario principal
              </span>

              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                  Dados para montar a resposta comercial
                </h2>
                <p className="text-sm leading-7 text-[var(--muted)] sm:text-base">
                  Nesta etapa, o envio apenas organiza e mostra os dados
                  preenchidos. Nenhuma API sera chamada ainda.
                </p>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Tipo de negocio
                  <select
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.businessType)}
                    className={inputClassName}
                  >
                    <option value="">Selecione uma opcao</option>
                    {businessTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.businessType ? (
                    <span className="mt-2 block text-sm text-red-700">
                      {errors.businessType}
                    </span>
                  ) : null}
                </label>

                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Nome da empresa
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
                    <span className="mt-2 block text-sm text-red-700">
                      {errors.companyName}
                    </span>
                  ) : null}
                </label>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Tom de voz
                  <select
                    name="tone"
                    value={formData.tone}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.tone)}
                    className={inputClassName}
                  >
                    <option value="">Selecione uma opcao</option>
                    {toneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.tone ? (
                    <span className="mt-2 block text-sm text-red-700">
                      {errors.tone}
                    </span>
                  ) : null}
                </label>

                <label className="block text-sm font-medium text-[var(--foreground)]">
                  Objetivo da resposta
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
                    <span className="mt-2 block text-sm text-red-700">
                      {errors.objective}
                    </span>
                  ) : null}
                </label>
              </div>

              <label className="block text-sm font-medium text-[var(--foreground)]">
                Mensagem do cliente
                <textarea
                  name="customerMessage"
                  value={formData.customerMessage}
                  onChange={handleChange}
                  placeholder="Cole aqui a mensagem recebida do cliente."
                  aria-invalid={Boolean(errors.customerMessage)}
                  className={textAreaClassName}
                />
                {errors.customerMessage ? (
                  <span className="mt-2 block text-sm text-red-700">
                    {errors.customerMessage}
                  </span>
                ) : null}
              </label>

              <div className="flex flex-col gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-[var(--muted)]">
                  Preencha os campos principais para visualizar os dados
                  organizados abaixo.
                </p>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full bg-[var(--foreground)] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-92"
                >
                  Gerar resposta
                </button>
              </div>
            </form>
          </div>

          {submittedData ? (
            <div className="mt-6 rounded-[2rem] border border-[var(--line)] bg-white/70 p-6 shadow-[0_18px_50px_rgba(45,39,25,0.08)] backdrop-blur-sm">
              <div className="space-y-2">
                <span className="inline-flex w-fit rounded-full border border-[var(--line)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                  Dados preenchidos
                </span>
                <h3 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                  Resumo do envio
                </h3>
                <p className="text-sm leading-7 text-[var(--muted)] sm:text-base">
                  Esta area mostra exatamente o que foi enviado pelo formulario.
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {summaryFields.map((field) => (
                  <div
                    key={field.key}
                    className="rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      {field.label}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--foreground)] sm:text-base">
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

              <div className="mt-4 rounded-[1.5rem] border border-[var(--line)] bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                  Mensagem do cliente
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[var(--foreground)] sm:text-base">
                  {submittedData.customerMessage}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
