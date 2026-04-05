import { describe, expect, it } from "vitest";

import type { SalesFormData } from "./buildSalesPrompt";
import { buildFallbackResponse } from "./buildFallbackResponse";

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
    objective: "fechar o atendimento",
    customerMessage: "Qual e o horario de atendimento?",
    ...overrides,
  };
}

describe("buildFallbackResponse", () => {
  it("contains the company name when provided", () => {
    const data = createSalesFormData({ companyName: "Clinica Aurora" });

    const response = buildFallbackResponse(data);

    expect(response).toContain("Clinica Aurora");
  });

  it.each(supportedBusinessTypes)(
    "returns a non-empty string for business type %s",
    (businessType) => {
      const response = buildFallbackResponse(
        createSalesFormData({ businessType }),
      );

      expect(response.trim().length).toBeGreaterThan(0);
    },
  );

  it.each(supportedTones)("returns a non-empty string for tone %s", (tone) => {
    const response = buildFallbackResponse(
      createSalesFormData({ businessType: "pet shop", tone }),
    );

    expect(response.trim().length).toBeGreaterThan(0);
  });

  it("does not throw when objective is an empty string", () => {
    expect(() =>
      buildFallbackResponse(createSalesFormData({ objective: "" })),
    ).not.toThrow();
  });

  it("does not throw when customerMessage is an empty string", () => {
    expect(() =>
      buildFallbackResponse(createSalesFormData({ customerMessage: "" })),
    ).not.toThrow();
  });

  it("returns different content for restaurante and clinica", () => {
    const restaurantResponse = buildFallbackResponse(
      createSalesFormData({
        businessType: "restaurante",
        companyName: "Sabor da Casa",
        customerMessage: "Qual e o horario de atendimento?",
      }),
    );

    const clinicResponse = buildFallbackResponse(
      createSalesFormData({
        businessType: "clinica",
        companyName: "Clinica Vida",
        customerMessage: "Qual e o horario de atendimento?",
      }),
    );

    expect(restaurantResponse).not.toBe(clinicResponse);
  });
});
