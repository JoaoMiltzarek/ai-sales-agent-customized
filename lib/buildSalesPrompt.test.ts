import { describe, expect, it } from "vitest";

import { buildSalesPrompt, type SalesFormData } from "./buildSalesPrompt";

const supportedBusinessTypes = [
  "restaurante",
  "oficina",
  "clinica",
  "pet shop",
  "outro",
] as const;

const supportedTones = [
  "profissional",
  "amigavel",
  "direto",
  "premium",
] as const;

function createSalesFormData(
  overrides: Partial<SalesFormData> = {},
): SalesFormData {
  return {
    businessType: "restaurante",
    companyName: "Empresa Exemplo",
    tone: "profissional",
    objective: "converter o atendimento em venda",
    customerMessage: "Quero saber mais detalhes do servico.",
    ...overrides,
  };
}

describe("buildSalesPrompt", () => {
  it("contains the company name when provided", () => {
    const data = createSalesFormData({ companyName: "Acme Vendas" });

    const prompt = buildSalesPrompt(data);

    expect(prompt).toContain("Acme Vendas");
  });

  it("contains the business type, tone, and customer message values", () => {
    const data = createSalesFormData({
      businessType: "pet shop",
      tone: "premium",
      customerMessage: "Meu pet precisa de banho ainda hoje.",
    });

    const prompt = buildSalesPrompt(data);
    const normalizedPrompt = prompt.toLowerCase();

    expect(normalizedPrompt).toContain(data.businessType);
    expect(normalizedPrompt).toContain(data.tone);
    expect(prompt).toContain(data.customerMessage);
  });

  it.each(supportedBusinessTypes)(
    "returns a non-empty string for business type %s",
    (businessType) => {
      const prompt = buildSalesPrompt(
        createSalesFormData({ businessType, tone: "amigavel" }),
      );

      expect(prompt.trim().length).toBeGreaterThan(0);
    },
  );

  it.each(supportedTones)("returns a non-empty string for tone %s", (tone) => {
    const prompt = buildSalesPrompt(
      createSalesFormData({ businessType: "clinica", tone }),
    );

    expect(prompt.trim().length).toBeGreaterThan(0);
  });

  it("does not throw when customerMessage is an empty string", () => {
    expect(() =>
      buildSalesPrompt(createSalesFormData({ customerMessage: "" })),
    ).not.toThrow();
  });
});
