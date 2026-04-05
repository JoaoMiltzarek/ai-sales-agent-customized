import type { GenerateRequest } from "./schemas";

export type { GenerateRequest } from "./schemas";

export type FormErrors = Partial<Record<keyof GenerateRequest, string>>;
