--- app/page.tsx (原始)
"use client";

import { useEffect, useRef, useState } from "react";

type SubmitValues = {
  companyName: string;
  businessType: string;
  tone: string;
  objective: string;
  clientMessage: string;
};

const businessOptions = [
  { value: "", label: "Selecionar" },
  { value: "restaurante", label: "Restaurante" },
  { value: "oficina", label: "Oficina Mecanica" },
  { value: "clinica", label: "Clinica" },
  { value: "petshop", label: "Pet Shop" },
  { value: "outro", label: "Outro" },
];

const toneOptions = [
  { value: "", label: "Selecionar" },
  { value: "profissional", label: "Profissional" },
  { value: "amigavel", label: "Amigavel" },
  { value: "direto", label: "Direto" },
  { value: "premium", label: "Premium" },
];

const workflowSteps = [
  "Configure seu negocio",
  "Descreva a situacao",
  "Copie a resposta gerada",
];

function mapBusinessTypeFromStorage(value: string) {
  if (value === "pet shop") {
    return "petshop";
  }

  return value;
}

function mapBusinessTypeForApi(value: string) {
  if (value === "petshop") {
    return "pet shop";
  }

  return value;
}

function normalizeValues(values: SubmitValues): SubmitValues {
  return {
    companyName: values.companyName.trim(),
    businessType: values.businessType.trim(),
    tone: values.tone.trim(),
    objective: values.objective.trim(),
    clientMessage: values.clientMessage.trim(),
  };
}

function readErrorMessage(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const firstMessage = value.find((item) => typeof item === "string");

    return typeof firstMessage === "string" ? firstMessage : undefined;
  }

  return undefined;
}

function normalizeServerErrors(value: unknown) {
  const nextErrors: Record<string, string> = {};

  if (!value || typeof value !== "object") {
    return nextErrors;
  }

  const source = value as Record<string, unknown>;

  const businessTypeError = readErrorMessage(source.businessType);
  const companyNameError = readErrorMessage(source.companyName);
  const toneError = readErrorMessage(source.tone);
  const objectiveError = readErrorMessage(source.objective);
  const clientMessageError =
    readErrorMessage(source.clientMessage) ??
    readErrorMessage(source.customerMessage);

  if (businessTypeError) {
    nextErrors.businessType = businessTypeError;
  }

  if (companyNameError) {
    nextErrors.companyName = companyNameError;
  }

  if (toneError) {
    nextErrors.tone = toneError;
  }

  if (objectiveError) {
    nextErrors.objective = objectiveError;
  }

  if (clientMessageError) {
    nextErrors.clientMessage = clientMessageError;
  }

  return nextErrors;
}

export default function Page() {
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [tone, setTone] = useState("");
  const [objective, setObjective] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lastValuesRef = useRef<object | null>(null);

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("sales_agent_config");

      if (!savedConfig) {
        return;
      }

      const parsed = JSON.parse(savedConfig) as {
        companyName?: unknown;
        businessType?: unknown;
        tone?: unknown;
      };

      if (typeof parsed.companyName === "string") {
        setCompanyName(parsed.companyName);
      }

      if (typeof parsed.businessType === "string") {
        setBusinessType(mapBusinessTypeFromStorage(parsed.businessType));
      }

      if (typeof parsed.tone === "string") {
        setTone(parsed.tone);
      }
    } catch {
      // Ignore invalid saved data and keep the default empty state.
    }
  }, []);

  function clearError(fieldName: string) {
    setErrors((currentErrors) => {
      if (!currentErrors[fieldName] && !currentErrors.general) {
        return currentErrors;
      }

      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      delete nextErrors.general;
      return nextErrors;
    });
  }

  function handleSaveProfile() {
    try {
      localStorage.setItem(
        "sales_agent_config",
        JSON.stringify({ companyName, businessType, tone }),
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setErrors({ general: "Nao foi possivel salvar o perfil agora." });
    }
  }

  async function handleSubmit(overrideValues?: SubmitValues) {
    setErrors({});
    setResult("");
    setCopied(false);

    const sourceValues =
      overrideValues ??
      ({
        businessType,
        companyName,
        tone,
        objective,
        clientMessage,
      } satisfies SubmitValues);

    const values = normalizeValues(sourceValues);
    const nextErrors: Record<string, string> = {};

    if (!values.companyName) {
      nextErrors.companyName = "Campo obrigatorio";
    }

    if (!values.businessType) {
      nextErrors.businessType = "Campo obrigatorio";
    }

    if (!values.tone) {
      nextErrors.tone = "Campo obrigatorio";
    }

    if (!values.objective) {
      nextErrors.objective = "Campo obrigatorio";
    }

    if (!values.clientMessage) {
      nextErrors.clientMessage = "Campo obrigatorio";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    if (overrideValues) {
      setCompanyName(values.companyName);
      setBusinessType(values.businessType);
      setTone(values.tone);
      setObjective(values.objective);
      setClientMessage(values.clientMessage);
    }

    lastValuesRef.current = values;
    setIsLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: mapBusinessTypeForApi(values.businessType),
          companyName: values.companyName,
          tone: values.tone,
          objective: values.objective,
          customerMessage: values.clientMessage,
          clientMessage: values.clientMessage,
        }),
      });

      if (res.headers.get("content-type")?.includes("text")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No stream");
        }

        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const text = chunk
            .replace(/^ /gm, "")
            .replace(/\n\n/g, "\n")
            .split("\n")
            .filter((line) => line.trim() !== "[DONE]")
            .join("\n");

          if (text) {
            accumulated += text;
            setResult(accumulated);
          }
        }

        const finalChunk = decoder.decode();
        const finalText = finalChunk
          .replace(/^ /gm, "")
          .replace(/\n\n/g, "\n")
          .split("\n")
          .filter((line) => line.trim() !== "[DONE]")
          .join("\n");

        if (finalText) {
          accumulated += finalText;
          setResult(accumulated);
        }

        if (!accumulated.trim()) {
          setErrors({
            general:
              "Nenhum texto foi retornado. Tente novamente em alguns instantes.",
          });
        }
      } else {
        const data = (await res.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;

        if (res.status === 400 && data.errors) {
          setErrors(normalizeServerErrors(data.errors));
          return;
        }

        if (!res.ok) {
          setErrors({
            general:
              typeof data.error === "string"
                ? data.error
                : "Erro ao gerar resposta. Tente novamente.",
          });
          return;
        }

        const text =
          (typeof data.response === "string" && data.response) ||
          (typeof data.content === "string" && data.content) ||
          (typeof data.message === "string" && data.message) ||
          (typeof data.responseText === "string" && data.responseText) ||
          "";

        if (!text.trim()) {
          setErrors({
            general:
              "Nenhum texto foi retornado. Tente novamente em alguns instantes.",
          });
          return;
        }

        setResult(text);
      }
    } catch {
      setErrors({ general: "Erro ao gerar resposta. Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="app-shell"
      style={{
        display: "flex",
        height: "100vh",
        background: "var(--bg-0)",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        :root {
          --bg-0: #05080F;
          --bg-1: #090D18;
          --bg-2: #0C1120;
          --bg-glass: rgba(9, 13, 24, 0.7);
          --accent: #0A84FF;
          --accent-dim: rgba(10, 132, 255, 0.12);
          --accent-border: rgba(10, 132, 255, 0.25);
          --accent-glow: rgba(10, 132, 255, 0.08);
          --border: rgba(255, 255, 255, 0.06);
          --border-strong: rgba(255, 255, 255, 0.1);
          --text-0: #FFFFFF;
          --text-1: #8E8E93;
          --text-2: #48484A;
          --success: #30D158;
          --error: #FF453A;
          --font: 'DM Sans', sans-serif;
          --font-mono: 'DM Mono', monospace;
        }

        html {
          background: var(--bg-0);
        }

        body {
          font-family: var(--font);
          background: var(--bg-0);
          color: var(--text-0);
          -webkit-font-smoothing: antialiased;
          overflow: hidden;
        }

        input, select, textarea, button {
          font-family: var(--font);
        }

        select option {
          background: #0C1120;
          color: white;
        }

        textarea {
          resize: none;
        }

        ::-webkit-scrollbar {
          width: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: var(--border-strong);
          border-radius: 4px;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }

        @keyframes shimmer {
          from { background-position: -200% 0; }
          to   { background-position: 200% 0; }
        }

        .skeleton {
          background: linear-gradient(
            90deg,
            var(--bg-2) 25%,
            rgba(10,132,255,0.06) 50%,
            var(--bg-2) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.8s infinite;
          border-radius: 6px;
        }

        .result-text {
          animation: fadeUp 0.35s ease forwards;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }

        .field-label {
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-1);
          margin-bottom: 6px;
        }

        .input-base {
          width: 100%;
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: 10px;
          padding: 11px 14px;
          color: var(--text-0);
          font-size: 14px;
          font-weight: 400;
          line-height: 1.5;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
          appearance: none;
        }

        .input-base:focus {
          border-color: var(--accent-border);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .input-base::placeholder {
          color: var(--text-2);
        }

        .card {
          background: var(--bg-1);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 24px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .card:hover {
          border-color: var(--border-strong);
        }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 11px 22px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s, box-shadow 0.15s;
          white-space: nowrap;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.88;
          box-shadow: 0 0 24px rgba(10,132,255,0.35);
        }

        .btn-primary:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .btn-ghost {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          color: var(--text-1);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 7px 14px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: color 0.15s, border-color 0.15s;
        }

        .btn-ghost:hover {
          color: var(--text-0);
          border-color: var(--border-strong);
        }

        .btn-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          border-radius: 6px;
          width: 30px;
          height: 30px;
          cursor: pointer;
          color: var(--text-1);
          transition: color 0.15s, background 0.15s;
        }

        .btn-icon:hover {
          color: var(--text-0);
          background: var(--border);
        }

        .divider {
          height: 1px;
          background: var(--border);
          margin: 20px 0;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.02em;
        }

        .saved-flash {
          font-size: 12px;
          color: var(--success);
          animation: fadeUp 0.2s ease forwards;
        }

        .app-shell {
          position: relative;
        }

        .app-shell::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 14% 12%, rgba(10,132,255,0.12), transparent 28%),
            radial-gradient(circle at 84% 8%, rgba(255,255,255,0.035), transparent 18%);
          pointer-events: none;
        }

        .app-shell > * {
          position: relative;
          z-index: 1;
        }

        .sidebar-shell,
        .top-bar,
        .card {
          backdrop-filter: blur(18px);
        }

        .card {
          background: linear-gradient(180deg, rgba(12,17,32,0.9), rgba(9,13,24,0.96));
          box-shadow: 0 24px 60px rgba(0,0,0,0.28);
          position: relative;
          overflow: hidden;
        }

        .card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255,255,255,0.03), transparent 24%);
          pointer-events: none;
        }

        .card > * {
          position: relative;
          z-index: 1;
        }

        .response-card {
          overflow: hidden;
        }

        @media (max-width: 920px) {
          body {
            overflow: auto;
          }

          .app-shell {
            flex-direction: column !important;
            height: 100dvh !important;
          }

          .sidebar-shell {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid var(--border);
            padding: 20px 18px !important;
          }

          .top-bar {
            padding: 0 18px !important;
          }

          .scroll-area {
            padding: 18px !important;
          }
        }
      `}</style>

      <div
        className="sidebar-shell"
        style={{
          width: "260px",
          flexShrink: 0,
          background: "var(--bg-1)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          padding: "24px 20px",
          overflowY: "auto",
          gap: 0,
        }}
      >
        <div style={{ marginBottom: 32 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: "linear-gradient(135deg, #0A84FF, #0055D4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 10px 24px rgba(10,132,255,0.3)",
              }}
            >
              <span style={{ color: "#FFFFFF", fontSize: 12, fontWeight: 700 }}>
                S
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#FFFFFF" }}>
                SalesAI
              </span>
              <span style={{ fontSize: 11, color: "var(--text-2)" }}>
                Assistente comercial
              </span>
            </div>
          </div>
        </div>

        <div className="field-label" style={{ marginBottom: 16 }}>
          PERFIL DO NEGOCIO
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label
              className="field-label"
              htmlFor="company-name"
              style={{ display: "block" }}
            >
              Empresa
            </label>
            <input
              id="company-name"
              className="input-base"
              type="text"
              placeholder="Nome do seu negocio"
              value={companyName}
              onChange={(event) => {
                setCompanyName(event.target.value);
                setSaved(false);
                clearError("companyName");
              }}
            />
            {errors.companyName ? (
              <p style={{ marginTop: 6, fontSize: 11, color: "var(--error)" }}>
                {errors.companyName}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="field-label"
              htmlFor="business-type"
              style={{ display: "block" }}
            >
              Segmento
            </label>
            <div style={{ position: "relative" }}>
              <select
                id="business-type"
                className="input-base"
                style={{ paddingRight: 38 }}
                value={businessType}
                onChange={(event) => {
                  setBusinessType(event.target.value);
                  setSaved(false);
                  clearError("businessType");
                }}
              >
                {businessOptions.map((option) => (
                  <option key={option.value || "placeholder"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-1)",
                  pointerEvents: "none",
                }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            {errors.businessType ? (
              <p style={{ marginTop: 6, fontSize: 11, color: "var(--error)" }}>
                {errors.businessType}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="field-label"
              htmlFor="tone"
              style={{ display: "block" }}
            >
              Tom de voz
            </label>
            <div style={{ position: "relative" }}>
              <select
                id="tone"
                className="input-base"
                style={{ paddingRight: 38 }}
                value={tone}
                onChange={(event) => {
                  setTone(event.target.value);
                  setSaved(false);
                  clearError("tone");
                }}
              >
                {toneOptions.map((option) => (
                  <option key={option.value || "placeholder"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-1)",
                  pointerEvents: "none",
                }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
            {errors.tone ? (
              <p style={{ marginTop: 6, fontSize: 11, color: "var(--error)" }}>
                {errors.tone}
              </p>
            ) : null}
          </div>
        </div>

        <div style={{ marginTop: 16, minHeight: 34 }}>
          {!saved ? (
            <button
              className="btn-ghost"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={handleSaveProfile}
              type="button"
            >
              Salvar perfil
            </button>
          ) : (
            <span className="saved-flash">✓ Perfil salvo</span>
          )}
        </div>

        <div style={{ flex: 1 }} />

        <div className="field-label" style={{ marginBottom: 16 }}>
          COMO FUNCIONA
        </div>

        <div>
          {workflowSteps.map((step, index) => (
            <div
              key={step}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                marginBottom: index === workflowSteps.length - 1 ? 0 : 10,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "var(--accent-dim)",
                  border: "1px solid var(--accent-border)",
                  color: "var(--accent)",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-2)",
                  lineHeight: 1.5,
                }}
              >
                {step}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="right-panel"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div
          className="top-bar"
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 28px",
            borderBottom: "1px solid var(--border)",
            background: "var(--bg-1)",
            height: 52,
          }}
        >
          <span style={{ fontSize: 14, fontWeight: 600, color: "#FFFFFF" }}>
            Gerador de Respostas
          </span>

          <div style={{ display: "flex", gap: 8 }}>
            <div
              className="badge"
              style={{
                background: "var(--accent-dim)",
                border: "1px solid var(--accent-border)",
                color: "var(--accent)",
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  background: "var(--accent)",
                  borderRadius: "50%",
                  display: "inline-flex",
                }}
              />
              GPT-4o
            </div>

            <div
              className="badge"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid var(--border)",
                color: "var(--text-1)",
              }}
            >
              Streaming
            </div>
          </div>
        </div>

        <div
          className="scroll-area"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: 28,
          }}
        >
          <div
            style={{
              maxWidth: 660,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div className="card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ color: "var(--accent)" }}
                  >
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span className="field-label" style={{ marginBottom: 0 }}>
                    MENSAGEM DO CLIENTE
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label
                    className="field-label"
                    htmlFor="objective"
                    style={{ display: "block" }}
                  >
                    Contexto
                  </label>
                  <input
                    id="objective"
                    className="input-base"
                    type="text"
                    placeholder="Ex: cliente pedindo desconto via WhatsApp"
                    value={objective}
                    onChange={(event) => {
                      setObjective(event.target.value);
                      clearError("objective");
                    }}
                  />
                  {errors.objective ? (
                    <p
                      style={{ marginTop: 6, fontSize: 11, color: "var(--error)" }}
                    >
                      {errors.objective}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label
                    className="field-label"
                    htmlFor="client-message"
                    style={{ display: "block" }}
                  >
                    Mensagem do cliente
                  </label>
                  <textarea
                    id="client-message"
                    className="input-base"
                    rows={5}
                    style={{ minHeight: 110 }}
                    placeholder="Cole aqui a mensagem exata do cliente..."
                    value={clientMessage}
                    onChange={(event) => {
                      setClientMessage(event.target.value);
                      clearError("clientMessage");
                    }}
                  />
                  {errors.clientMessage ? (
                    <p
                      style={{ marginTop: 6, fontSize: 11, color: "var(--error)" }}
                    >
                      {errors.clientMessage}
                    </p>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: 12,
                  marginTop: 20,
                }}
              >
                {errors.general ? (
                  <span
                    style={{
                      marginRight: "auto",
                      fontSize: 12,
                      color: "var(--error)",
                    }}
                  >
                    {errors.general}
                  </span>
                ) : null}

                <button
                  className="btn-primary"
                  disabled={isLoading}
                  onClick={() => {
                    void handleSubmit();
                  }}
                  type="button"
                >
                  {isLoading ? (
                    <>
                      <span className="spinner" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      Gerar resposta
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="card response-card" style={{ minHeight: 200 }}>
              {result === "" && !isLoading ? (
                <div
                  style={{
                    minHeight: 200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ position: "relative" }}>
                    <div
                      style={{
                        position: "absolute",
                        width: 120,
                        height: 120,
                        background: "var(--accent-dim)",
                        borderRadius: "50%",
                        filter: "blur(40px)",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />

                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                        textAlign: "center",
                      }}
                    >
                      <svg
                        width="28"
                        height="28"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        style={{ color: "var(--accent)", opacity: 0.6 }}
                      >
                        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
                      </svg>
                      <p
                        style={{
                          marginTop: 12,
                          fontSize: 14,
                          color: "var(--text-1)",
                        }}
                      >
                        Pronto para gerar
                      </p>
                      <p
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: "var(--text-2)",
                          maxWidth: 240,
                          marginLeft: "auto",
                          marginRight: "auto",
                        }}
                      >
                        Preencha os campos e clique em Gerar resposta
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {isLoading && result === "" ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 20,
                    }}
                  >
                    <span
                      className="spinner"
                      style={{ borderTopColor: "var(--accent)" }}
                    />
                    <span
                      style={{
                        fontSize: 12,
                        color: "var(--accent)",
                        animation: "pulse 1.5s infinite",
                      }}
                    >
                      Gerando resposta...
                    </span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div className="skeleton" style={{ height: 14, width: "75%" }} />
                    <div className="skeleton" style={{ height: 14, width: "100%" }} />
                    <div className="skeleton" style={{ height: 14, width: "60%" }} />
                  </div>
                </div>
              ) : null}

              {result !== "" ? (
                <div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 16,
                    }}
                  >
                    <span className="field-label" style={{ marginBottom: 0 }}>
                      RESPOSTA GERADA
                    </span>

                    <div style={{ display: "flex", gap: 2 }}>
                      <button
                        className="btn-icon"
                        title="Copiar resposta"
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(result);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? (
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            style={{ color: "var(--success)" }}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          >
                            <rect x="9" y="2" width="13" height="13" rx="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                        )}
                      </button>

                      <button
                        className="btn-icon"
                        title="Gerar novamente"
                        type="button"
                        disabled={isLoading}
                        onClick={() => {
                          const lastValues = lastValuesRef.current as
                            | SubmitValues
                            | null;

                          if (!lastValues) {
                            return;
                          }

                          void handleSubmit(lastValues);
                        }}
                        style={
                          isLoading
                            ? { opacity: 0.45, cursor: "not-allowed" }
                            : undefined
                        }
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                          <path d="M21 3v5h-5" />
                          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                          <path d="M8 16H3v5" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="divider" />

                  <p
                    className="result-text"
                    style={{
                      fontSize: 15,
                      lineHeight: 1.8,
                      color: "var(--text-0)",
                      fontFamily: "var(--font)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {result}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

+++ app/page.tsx (修改后)
"use client";

import { useEffect, useRef, useState } from "react";

type SubmitValues = {
  companyName: string;
  businessType: string;
  tone: string;
  objective: string;
  clientMessage: string;
};

const businessOptions = [
  { value: "", label: "Selecionar" },
  { value: "RESTAURANTE", label: "RESTAURANTE" },
  { value: "OFICINA", label: "OFICINA" },
  { value: "CLÍNICA", label: "CLÍNICA" },
  { value: "PET SHOP", label: "PET SHOP" },
  { value: "OUTRO", label: "OUTRO" },
];

const toneOptions = [
  { value: "", label: "Selecionar" },
  { value: "PROFISSIONAL", label: "PROFISSIONAL" },
  { value: "AMIGÁVEL", label: "AMIGÁVEL" },
  { value: "DIRETO", label: "DIRETO" },
  { value: "PREMIUM", label: "PREMIUM" },
];

function mapBusinessTypeFromStorage(value: string) {
  if (value === "pet shop") return "PET SHOP";
  const upper = value.toUpperCase();
  if (["RESTAURANTE", "OFICINA", "CLÍNICA", "PET SHOP", "OUTRO"].includes(upper)) return upper;
  return value;
}

function mapBusinessTypeForApi(value: string) {
  if (value === "PET SHOP") return "pet shop";
  return value.toLowerCase();
}

function normalizeValues(values: SubmitValues): SubmitValues {
  return {
    companyName: values.companyName.trim(),
    businessType: values.businessType.trim(),
    tone: values.tone.trim(),
    objective: values.objective.trim(),
    clientMessage: values.clientMessage.trim(),
  };
}

function readErrorMessage(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const firstMessage = value.find((item) => typeof item === "string");
    return typeof firstMessage === "string" ? firstMessage : undefined;
  }
  return undefined;
}

function normalizeServerErrors(value: unknown) {
  const nextErrors: Record<string, string> = {};
  if (!value || typeof value !== "object") return nextErrors;
  const source = value as Record<string, unknown>;
  const businessTypeError = readErrorMessage(source.businessType);
  const companyNameError = readErrorMessage(source.companyName);
  const toneError = readErrorMessage(source.tone);
  const objectiveError = readErrorMessage(source.objective);
  const clientMessageError = readErrorMessage(source.clientMessage) ?? readErrorMessage(source.customerMessage);
  if (businessTypeError) nextErrors.businessType = businessTypeError;
  if (companyNameError) nextErrors.companyName = companyNameError;
  if (toneError) nextErrors.tone = toneError;
  if (objectiveError) nextErrors.objective = objectiveError;
  if (clientMessageError) nextErrors.clientMessage = clientMessageError;
  return nextErrors;
}

export default function Page() {
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [tone, setTone] = useState("");
  const [objective, setObjective] = useState("");
  const [clientMessage, setClientMessage] = useState("");
  const [result, setResult] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lastValuesRef = useRef<SubmitValues | null>(null);
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("sales_agent_config");
      if (!savedConfig) return;
      const parsed = JSON.parse(savedConfig) as { companyName?: unknown; businessType?: unknown; tone?: unknown };
      if (typeof parsed.companyName === "string") setCompanyName(parsed.companyName);
      if (typeof parsed.businessType === "string") setBusinessType(mapBusinessTypeFromStorage(parsed.businessType));
      if (typeof parsed.tone === "string") setTone(parsed.tone);
    } catch {}
  }, []);

  function clearError(fieldName: string) {
    setErrors((currentErrors) => {
      if (!currentErrors[fieldName] && !currentErrors.general) return currentErrors;
      const nextErrors = { ...currentErrors };
      delete nextErrors[fieldName];
      delete nextErrors.general;
      return nextErrors;
    });
  }

  function handleSaveProfile() {
    try {
      localStorage.setItem("sales_agent_config", JSON.stringify({ companyName, businessType, tone }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setErrors({ general: "Unable to save profile." });
    }
  }

  async function handleSubmit(overrideValues?: SubmitValues) {
    setErrors({});
    setResult("");
    setCopied(false);
    const sourceValues = overrideValues ?? ({ businessType, companyName, tone, objective, clientMessage } satisfies SubmitValues);
    const values = normalizeValues(sourceValues);
    const nextErrors: Record<string, string> = {};
    if (!values.companyName) nextErrors.companyName = "Required";
    if (!values.businessType) nextErrors.businessType = "Required";
    if (!values.tone) nextErrors.tone = "Required";
    if (!values.objective) nextErrors.objective = "Required";
    if (!values.clientMessage) nextErrors.clientMessage = "Required";
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    if (overrideValues) {
      setCompanyName(values.companyName);
      setBusinessType(values.businessType);
      setTone(values.tone);
      setObjective(values.objective);
      setClientMessage(values.clientMessage);
    }
    lastValuesRef.current = values;
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessType: mapBusinessTypeForApi(values.businessType),
          companyName: values.companyName,
          tone: values.tone,
          objective: values.objective,
          customerMessage: values.clientMessage,
          clientMessage: values.clientMessage,
        }),
      });
      if (res.headers.get("content-type")?.includes("text")) {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error("No stream");
        let accumulated = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const text = chunk.replace(/^ /gm, "").replace(/\n\n/g, "\n").split("\n").filter((line) => line.trim() !== "[DONE]").join("\n");
          if (text) {
            accumulated += text;
            setResult(accumulated);
          }
        }
        const finalChunk = decoder.decode();
        const finalText = finalChunk.replace(/^ /gm, "").replace(/\n\n/g, "\n").split("\n").filter((line) => line.trim() !== "[DONE]").join("\n");
        if (finalText) {
          accumulated += finalText;
          setResult(accumulated);
        }
        if (!accumulated.trim()) setErrors({ general: "No text was returned. Try again in a few moments." });
      } else {
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        if (res.status === 400 && data.errors) {
          setErrors(normalizeServerErrors(data.errors));
          return;
        }
        if (!res.ok) {
          setErrors({ general: typeof data.error === "string" ? data.error : "Error generating response. Try again." });
          return;
        }
        const text = (typeof data.response === "string" && data.response) || (typeof data.content === "string" && data.content) || (typeof data.message === "string" && data.message) || (typeof data.responseText === "string" && data.responseText) || "";
        if (!text.trim()) {
          setErrors({ general: "No text was returned. Try again in a few moments." });
          return;
        }
        setResult(text);
      }
    } catch {
      setErrors({ general: "Error generating response. Try again." });
    } finally {
      setIsLoading(false);
    }
  }

  const wordCount = result.length > 0 ? result.split(/\s+/).filter(Boolean).length : 0;
  const isProfileLoaded = companyName.trim() !== "";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Geist+Mono:wght@300;400;500&family=Geist:wght@300;400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --void: #02030A; --deep: #060B14; --layer: #0B1220;
          --line: rgba(255,255,255,0.07); --line-active: rgba(255,255,255,0.15);
          --amber: #F59E0B; --amber-dim: rgba(245,158,11,0.08);
          --amber-border: rgba(245,158,11,0.2); --amber-glow: rgba(245,158,11,0.06);
          --text-0: #F4F4F5; --text-1: #71717A; --text-2: #3F3F46;
          --green: #10B981; --red: #EF4444;
          --f-display: 'Bebas Neue', sans-serif; --f-mono: 'Geist Mono', monospace; --f-ui: 'Geist', sans-serif;
        }
        html { background: var(--void); }
        body { font-family: var(--f-ui); background: var(--void); color: var(--text-0); -webkit-font-smoothing: antialiased; overflow: hidden; }
        body::before { content: ""; position: fixed; inset: 0; background-image: url("image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E"); pointer-events: none; z-index: 999; }
        .ambient-glow { position: fixed; width: 600px; height: 600px; background: radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%); filter: blur(120px); pointer-events: none; z-index: 0; top: 50%; left: 70%; transform: translate(-50%, -50%); }
        input, select, textarea, button { font-family: inherit; }
        select option { background: var(--deep); color: var(--text-0); }
        textarea { resize: vertical; }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--line-active); border-radius: 2px; }
        input, textarea, select { caret-color: var(--amber); }
        select { background-image: url("image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%2371717A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0 center; padding-right: 16px; appearance: none; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { from { background-position: -200% 0; } to { background-position: 200% 0; } }
        @keyframes ping { 0% { transform: scale(1); opacity: 1; } 75%, 100% { transform: scale(2); opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
        .slide-in-left { animation: slideIn 0.5s ease forwards; }
        .fade-up-right { animation: fadeUp 0.5s ease 0.15s both forwards; }
        .scanline-overlay { position: absolute; inset: 0; pointer-events: none; opacity: 0.3; background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px); z-index: 1; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .status-dot.green { background: var(--green); box-shadow: 0 0 8px var(--green); }
        .status-dot.amber { background: var(--amber); box-shadow: 0 0 8px var(--amber); }
        .status-dot.red { background: var(--red); }
        .status-dot.gray { background: var(--text-2); }
        .ping-dot { position: relative; }
        .ping-dot::after { content: ""; position: absolute; inset: 0; border-radius: 50%; background: var(--green); animation: ping 2s infinite; }
        .spinner { width: 12px; height: 12px; border: 2px solid var(--amber-border); border-top-color: var(--amber); border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        .skeleton { height: 12px; border-radius: 2px; background: linear-gradient(90deg, var(--layer) 25%, rgba(245,158,11,0.06) 50%, var(--layer) 75%); background-size: 200% 100%; animation: shimmer 1.8s infinite; }
        .input-minimal { width: 100%; background: transparent; border: none; border-bottom: 1px solid var(--line); border-radius: 0; padding: 8px 0; color: var(--text-0); font-family: var(--f-mono); font-size: 13px; outline: none; transition: border-color 0.2s; }
        .input-minimal:focus { border-bottom-color: var(--amber); }
        .input-minimal::placeholder { color: var(--text-2); }
        .btn-minimal { background: transparent; border: 1px solid var(--line); color: var(--text-1); font-family: var(--f-mono); font-size: 11px; letter-spacing: 0.08em; padding: 7px 14px; border-radius: 4px; cursor: pointer; width: 100%; text-transform: uppercase; transition: all 0.15s; }
        .btn-minimal:hover { border-color: var(--amber-border); color: var(--amber); }
        .btn-deploy { background: var(--amber); color: #000000; border: none; border-radius: 4px; padding: 10px 24px; font-family: var(--f-display); font-size: 16px; letter-spacing: 0.1em; cursor: pointer; transition: all 0.2s; text-transform: uppercase; }
        .btn-deploy:hover:not(:disabled) { box-shadow: 0 0 30px rgba(245,158,11,0.4); transform: translateY(-1px); }
        .btn-deploy:disabled { background: var(--layer); color: var(--amber); border: 1px solid var(--amber-border); cursor: not-allowed; }
        .btn-ghost-small { background: transparent; color: var(--text-1); border: 1px solid var(--line); border-radius: 3px; padding: 5px 10px; font-family: var(--f-mono); font-size: 10px; text-transform: uppercase; cursor: pointer; transition: all 0.15s; }
        .btn-ghost-small:hover { border-color: var(--amber-border); color: var(--amber); }
        .macos-dots { display: flex; gap: 6px; }
        .macos-dot { width: 10px; height: 10px; border-radius: 50%; }
        .macos-dot.red { background: #FF5F57; }
        .macos-dot.yellow { background: #FEBC2E; }
        .macos-dot.green { background: #28C840; }
        .section-header { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
        .section-indicator { width: 1px; height: 12px; background: var(--amber); }
        .section-title { font-size: 10px; color: var(--text-1); text-transform: uppercase; letter-spacing: 0.1em; font-family: var(--f-mono); }
        .field-label-minimal { font-size: 10px; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.08em; font-family: var(--f-mono); margin-bottom: 5px; }
        .status-badge { display: flex; align-items: center; gap: 5px; font-family: var(--f-mono); font-size: 10px; }
        .status-dot-small { width: 5px; height: 5px; border-radius: 50%; }
        .status-dot-small.green { background: var(--green); }
        .status-dot-small.amber { background: var(--amber); }
        .status-dot-small.red { background: var(--red); }
      `}</style>

      <div className="ambient-glow" />

      <div className="slide-in-left" style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden", background: "var(--void)", fontFamily: "var(--f-ui)", position: "relative" }}>
        {/* LEFT PANEL */}
        <div style={{ width: "300px", flexShrink: 0, background: "var(--deep)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", padding: 0 }}>
          {/* TOP HEADER */}
          <div style={{ height: "64px", borderBottom: "1px solid var(--line)", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className={`status-dot ${isProfileLoaded ? "ping-dot green" : "gray"}`} style={{ width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" }} />
              <span style={{ fontFamily: "var(--f-display)", fontSize: "20px", letterSpacing: "0.15em", color: "var(--text-0)" }}>SALESAI</span>
            </div>
            <span style={{ fontSize: "10px", color: "var(--text-2)", fontFamily: "var(--f-mono)" }}>v2.1</span>
          </div>

          {/* CONTENT */}
          <div style={{ flex: 1, padding: "24px", display: "flex", flexDirection: "column", gap: "24px", overflowY: "auto" }}>
            {/* OPERATOR PROFILE SECTION */}
            <div>
              <div className="section-header">
                <div className="section-indicator" />
                <span className="section-title">OPERATOR PROFILE</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label className="field-label-minimal">// ENTITY NAME</label>
                  <input className="input-minimal" type="text" placeholder="Acme Comercial Ltda" value={companyName} onChange={(e) => { setCompanyName(e.target.value); setSaved(false); clearError("companyName"); }} />
                  {errors.companyName && <p style={{ marginTop: "4px", fontSize: "10px", color: "var(--red)", fontFamily: "var(--f-mono)" }}>{errors.companyName}</p>}
                </div>
                <div>
                  <label className="field-label-minimal">// SECTOR</label>
                  <select className="input-minimal" value={businessType} onChange={(e) => { setBusinessType(e.target.value); setSaved(false); clearError("businessType"); }}>
                    {businessOptions.map((opt) => (<option key={opt.value || "placeholder"} value={opt.value}>{opt.label}</option>))}
                  </select>
                  {errors.businessType && <p style={{ marginTop: "4px", fontSize: "10px", color: "var(--red)", fontFamily: "var(--f-mono)" }}>{errors.businessType}</p>}
                </div>
                <div>
                  <label className="field-label-minimal">// COMM PROTOCOL</label>
                  <select className="input-minimal" value={tone} onChange={(e) => { setTone(e.target.value); setSaved(false); clearError("tone"); }}>
                    {toneOptions.map((opt) => (<option key={opt.value || "placeholder"} value={opt.value}>{opt.label}</option>))}
                  </select>
                  {errors.tone && <p style={{ marginTop: "4px", fontSize: "10px", color: "var(--red)", fontFamily: "var(--f-mono)" }}>{errors.tone}</p>}
                </div>
              </div>
              <div style={{ marginTop: "8px" }}>
                <button className="btn-minimal" onClick={handleSaveProfile} type="button">{saved ? <span style={{ color: "var(--green)" }}>✓ PROFILE SAVED</span> : "[ SAVE PROFILE ]"}</button>
              </div>
            </div>

            {/* DIVIDER */}
            <div style={{ height: "1px", background: "var(--line)" }} />

            {/* SYSTEM STATUS SECTION */}
            <div>
              <div className="section-header">
                <div className="section-indicator" />
                <span className="section-title">SYSTEM STATUS</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-1)", fontFamily: "var(--f-mono)" }}>AI ENGINE</span>
                  <div className="status-badge"><span className="status-dot-small green" /><span style={{ color: "var(--green)" }}>ONLINE</span></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-1)", fontFamily: "var(--f-mono)" }}>STREAMING</span>
                  <div className="status-badge"><span className="status-dot-small amber" /><span style={{ color: "var(--amber)" }}>ACTIVE</span></div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "10px", color: "var(--text-1)", fontFamily: "var(--f-mono)" }}>PROFILE</span>
                  <div className="status-badge"><span className={`status-dot-small ${isProfileLoaded ? "green" : "red"}`} /><span style={{ color: isProfileLoaded ? "var(--green)" : "var(--red)" }}>{isProfileLoaded ? "LOADED" : "EMPTY"}</span></div>
                </div>
              </div>
            </div>

            {/* SPACER */}
            <div style={{ flex: 1 }} />

            {/* PROTOCOL STEPS */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontFamily: "var(--f-display)", fontSize: "11px", color: "var(--amber)" }}>01</span>
                <span style={{ fontSize: "11px", color: "var(--text-2)", fontFamily: "var(--f-mono)" }}>CONFIGURE OPERATOR PROFILE</span>
              </div>
              <div style={{ height: "1px", background: "var(--line)", marginBottom: "8px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontFamily: "var(--f-display)", fontSize: "11px", color: "var(--amber)" }}>02</span>
                <span style={{ fontSize: "11px", color: "var(--text-2)", fontFamily: "var(--f-mono)" }}>INPUT CLIENT MESSAGE</span>
              </div>
              <div style={{ height: "1px", background: "var(--line)", marginBottom: "8px" }} />
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontFamily: "var(--f-display)", fontSize: "11px", color: "var(--amber)" }}>03</span>
                <span style={{ fontSize: "11px", color: "var(--text-2)", fontFamily: "var(--f-mono)" }}>DEPLOY RESPONSE</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="fade-up-right" style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", position: "relative", zIndex: 1 }}>
          {/* TOP BAR */}
          <div style={{ height: "64px", borderBottom: "1px solid var(--line)", padding: "0 36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h1 style={{ fontFamily: "var(--f-display)", fontSize: "28px", letterSpacing: "0.05em", color: "var(--text-0)", lineHeight: 1, margin: 0 }}>RESPONSE INTELLIGENCE</h1>
              <p style={{ fontSize: "10px", color: "var(--text-2)", fontFamily: "var(--f-mono)", marginTop: "4px" }}>AI-POWERED COMMERCIAL RESPONSE SYSTEM</p>
            </div>
            {/* METRICS */}
            <div style={{ display: "flex", gap: "24px" }}>
              <div><div style={{ fontFamily: "var(--f-display)", fontSize: "20px", color: "var(--amber)", lineHeight: 1 }}>GPT-4O</div><div style={{ fontSize: "9px", color: "var(--text-2)", fontFamily: "var(--f-mono)", textTransform: "uppercase" }}>MODEL</div></div>
              <div><div style={{ fontFamily: "var(--f-display)", fontSize: "20px", color: "var(--amber)", lineHeight: 1 }}>3-STEP</div><div style={{ fontSize: "9px", color: "var(--text-2)", fontFamily: "var(--f-mono)", textTransform: "uppercase" }}>PIPELINE</div></div>
              <div><div style={{ fontFamily: "var(--f-display)", fontSize: "20px", color: "var(--amber)", lineHeight: 1 }}>{wordCount > 0 ? wordCount : "—"}</div><div style={{ fontSize: "9px", color: "var(--text-2)", fontFamily: "var(--f-mono)", textTransform: "uppercase" }}>WORDS GEN.</div></div>
            </div>
          </div>

          {/* SCROLL AREA */}
          <div style={{ flex: 1, overflowY: "auto", padding: "36px" }}>
            <div style={{ maxWidth: "700px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* CARD 1: INPUT TERMINAL */}
              <div style={{ background: "var(--deep)", border: "1px solid var(--line)", borderRadius: "8px", overflow: "hidden" }}>
                {/* CARD HEADER */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="macos-dots"><span className="macos-dot red" /><span className="macos-dot yellow" /><span className="macos-dot green" /></div>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: "11px", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>mission-input.config</span>
                  </div>
                  <span style={{ fontFamily: "var(--f-mono)", fontSize: "10px", color: "var(--text-2)" }}>{currentTime}</span>
                </div>

                {/* CARD BODY */}
                <div style={{ padding: "20px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div>
                      <label className="field-label-minimal">// SITUATION CONTEXT</label>
                      <input className="input-minimal" type="text" placeholder="Ex: cliente questionando prazo de entrega" value={objective} onChange={(e) => { setObjective(e.target.value); clearError("objective"); }} />
                      {errors.objective && <p style={{ marginTop: "4px", fontSize: "10px", color: "var(--red)", fontFamily: "var(--f-mono)" }}>{errors.objective}</p>}
                    </div>
                    <div>
                      <label className="field-label-minimal">// CLIENT MESSAGE INPUT</label>
                      <textarea className="input-minimal" rows={4} style={{ minHeight: "100px", lineHeight: 1.7 }} placeholder="Paste the client message here..." value={clientMessage} onChange={(e) => { setClientMessage(e.target.value); clearError("clientMessage"); }} />
                      {errors.clientMessage && <p style={{ marginTop: "4px", fontSize: "10px", color: "var(--red)", fontFamily: "var(--f-mono)" }}>{errors.clientMessage}</p>}
                    </div>
                  </div>

                  {/* FOOTER */}
                  <div style={{ marginTop: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: "10px", color: "var(--text-2)" }}>{clientMessage.length} CHARS</span>
                    <button className="btn-deploy" disabled={isLoading} onClick={() => void handleSubmit()} type="button">
                      {isLoading ? (<div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span className="spinner" />PROCESSING...</div>) : ("DEPLOY RESPONSE →")}
                    </button>
                  </div>
                  {errors.general && <p style={{ marginTop: "12px", fontSize: "11px", color: "var(--red)", fontFamily: "var(--f-mono)" }}>{errors.general}</p>}
                </div>
              </div>

              {/* CARD 2: INTELLIGENCE OUTPUT */}
              <div style={{ background: "var(--deep)", border: `1px solid ${result !== "" ? "var(--amber-border)" : "var(--line)"}`, borderRadius: "8px", overflow: "hidden", minHeight: "240px", transition: "border-color 0.3s, box-shadow 0.3s", boxShadow: result !== "" ? "0 0 40px var(--amber-glow)" : "none", position: "relative" }}>
                {/* CARD HEADER */}
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="macos-dots"><span className="macos-dot red" /><span className="macos-dot yellow" /><span className="macos-dot green" /></div>
                    <span style={{ fontFamily: "var(--f-mono)", fontSize: "11px", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.08em" }}>intelligence-output.log</span>
                  </div>
                  {result !== "" && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button className="btn-ghost-small" onClick={() => { void navigator.clipboard.writeText(result); setCopied(true); setTimeout(() => setCopied(false), 2000); }} type="button">{copied ? <span style={{ color: "var(--green)" }}>[ COPIED ✓ ]</span> : "[ COPY ]"}</button>
                      <button className="btn-ghost-small" disabled={isLoading} onClick={() => { if (lastValuesRef.current) { void handleSubmit(lastValuesRef.current); } }} type="button" style={isLoading ? { opacity: 0.5, cursor: "not-allowed" } : undefined}>[ RETRY ]</button>
                    </div>
                  )}
                </div>

                {/* CARD BODY */}
                <div style={{ padding: "24px", position: "relative", minHeight: "168px" }}>
                  {/* STATE A — Empty */}
                  {result === "" && !isLoading && (
                    <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "12px", textAlign: "center" }}>
                      <span style={{ fontFamily: "var(--f-display)", fontSize: "72px", color: "var(--line-active)", letterSpacing: "0.05em", userSelect: "none", lineHeight: 1 }}>STAND BY</span>
                      <span style={{ fontFamily: "var(--f-mono)", fontSize: "11px", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.1em" }}>AWAITING MISSION PARAMETERS</span>
                    </div>
                  )}

                  {/* STATE B — Loading */}
                  {isLoading && result === "" && (
                    <div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontFamily: "var(--f-mono)", fontSize: "12px", color: "var(--amber)", animation: "pulse 1.5s infinite" }}>&gt; Analyzing client intent...</span>
                        <span style={{ fontFamily: "var(--f-mono)", fontSize: "12px", color: "var(--text-2)", opacity: 0.6, animation: "pulse 1.5s infinite", animationDelay: "0.3s" }}>&gt; Building contextual response...</span>
                        <span style={{ fontFamily: "var(--f-mono)", fontSize: "12px", color: "var(--text-2)", opacity: 0.3, animation: "pulse 1.5s infinite", animationDelay: "0.6s" }}>&gt; Running quality evaluation...</span>
                      </div>
                      <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div className="skeleton" style={{ width: "90%" }} />
                        <div className="skeleton" style={{ width: "75%" }} />
                        <div className="skeleton" style={{ width: "55%" }} />
                      </div>
                    </div>
                  )}

                  {/* STATE C — Has result */}
                  {result !== "" && (
                    <>
                      <div className="scanline-overlay" />
                      <div style={{ position: "relative", zIndex: 1 }}>
                        <p style={{ fontFamily: "var(--f-mono)", fontSize: "14px", lineHeight: 1.9, color: "var(--text-0)", whiteSpace: "pre-wrap", animation: "fadeUp 0.4s ease forwards" }}>{result}</p>
                        <div style={{ marginTop: "20px" }}>
                          <div style={{ height: "1px", background: "var(--line)" }} />
                          <div style={{ marginTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: "var(--f-mono)", fontSize: "10px", color: "var(--text-2)" }}>{result.split(/\s+/).filter(Boolean).length} words generated</span>
                            <span style={{ fontFamily: "var(--f-mono)", fontSize: "10px", color: "var(--amber)" }}>MISSION COMPLETE</span>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}