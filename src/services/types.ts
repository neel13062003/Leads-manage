export type Source = "facebook" | "instagram";

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  source: Source;
  formName?: string;
  createdAt: string;
  // extra fields from the webhook response are allowed
  [key: string]: unknown;
}

export interface ImportResult {
  imported: number;
  duplicates: number;
}

export interface SourceStatus {
  configured: boolean;
  lastReceived: string | null;
}
