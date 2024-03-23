interface ValidationStatus {
  data?: any;
  status: "pending" | "progressing" | "checked" | "failed" | "unavailable";
}

export type { ValidationStatus };
