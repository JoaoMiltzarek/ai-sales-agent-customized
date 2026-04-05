export type BusinessConfig = {
  businessType: string;
  companyName: string;
  tone: string;
};

const STORAGE_KEY = "sales_agent_config";

export function saveBusinessConfig(config: BusinessConfig): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage failures in SSR and restricted browsing modes.
  }
}

export function loadBusinessConfig(): BusinessConfig | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return null;
    }

    const storedConfig = window.localStorage.getItem(STORAGE_KEY);

    if (!storedConfig) {
      return null;
    }

    const parsedConfig = JSON.parse(storedConfig);

    if (
      typeof parsedConfig !== "object" ||
      parsedConfig === null ||
      typeof parsedConfig.businessType !== "string" ||
      typeof parsedConfig.companyName !== "string" ||
      typeof parsedConfig.tone !== "string"
    ) {
      return null;
    }

    return {
      businessType: parsedConfig.businessType,
      companyName: parsedConfig.companyName,
      tone: parsedConfig.tone,
    };
  } catch {
    return null;
  }
}
