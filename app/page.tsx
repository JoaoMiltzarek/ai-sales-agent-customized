const futureFields = [
  "Tipo de negocio",
  "Nome da empresa",
  "Tom de voz",
  "Objetivo da resposta",
  "Mensagem do cliente",
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center gap-16 px-6 py-16 lg:flex-row lg:items-center lg:gap-20 lg:px-10">
        <div className="flex max-w-xl flex-col gap-6 animate-enter">
          <p className="font-serif text-lg italic text-[var(--accent)]">
            MVP para portfolio
          </p>

          <div className="space-y-4">
            <span className="inline-flex w-fit items-center rounded-full border border-[var(--line)] bg-[var(--surface)] px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
              ai-sales-agent-customized
            </span>

            <h1 className="max-w-lg text-4xl font-semibold tracking-[-0.05em] text-[var(--foreground)] sm:text-5xl lg:text-6xl">
              Respostas comerciais personalizadas de forma simples.
            </h1>

            <p className="max-w-lg text-base leading-7 text-[var(--muted)] sm:text-lg">
              Este projeto vai gerar mensagens comerciais adaptadas ao tipo de
              negocio, ao contexto da empresa e ao objetivo da resposta.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 text-sm text-[var(--muted)]">
            <span className="rounded-full border border-[var(--line)] px-4 py-2">
              Next.js
            </span>
            <span className="rounded-full border border-[var(--line)] px-4 py-2">
              TypeScript
            </span>
            <span className="rounded-full border border-[var(--line)] px-4 py-2">
              Tailwind CSS
            </span>
          </div>
        </div>

        <div className="w-full max-w-xl animate-enter-delayed">
          <div className="placeholder-panel">
            <div className="space-y-4">
              <span className="inline-flex w-fit rounded-full border border-[var(--line)] bg-white/65 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Formulario futuro
              </span>

              <div className="space-y-3">
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-[var(--foreground)]">
                  Aqui ficara a area principal do MVP
                </h2>
                <p className="max-w-lg text-sm leading-7 text-[var(--muted)] sm:text-base">
                  Nesta proxima etapa, vamos transformar esta estrutura em um
                  formulario simples para montar respostas comerciais prontas
                  para uso.
                </p>
              </div>
            </div>

            <div className="space-y-3 border-t border-[var(--line)] pt-8">
              {futureFields.map((field, index) => (
                <div
                  key={field}
                  className="flex items-center justify-between border-b border-[var(--line)] pb-3 text-sm text-[var(--foreground)] last:border-b-0 last:pb-0 sm:text-base"
                >
                  <span>{field}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                    Campo {index + 1}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-dashed border-[var(--line-strong)] bg-white/55 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                Saida esperada
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)] sm:text-base">
                Uma resposta comercial personalizada, clara e pronta para copiar
                e adaptar.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
