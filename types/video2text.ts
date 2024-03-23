interface ValidationStatus {
  data?: any;
  status: "pending" | "progressing" | "checked" | "failed" | "unavailable";
}
interface ConvertStatus {
  data?: any;
  status: "progressing" | "failed" | "finished" | "";
}

export type { ValidationStatus, ConvertStatus };
