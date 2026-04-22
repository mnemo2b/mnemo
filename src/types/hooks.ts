export interface SessionStartEntry {
  matcher?: string;
  hooks?: Array<{ type: string; command: string }>;
}
