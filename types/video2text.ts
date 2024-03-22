interface ValidationStatus {
  data?: any;
  status: "pending" | "progressing" | "checked" | "failed";
}

export type { ValidationStatus };
