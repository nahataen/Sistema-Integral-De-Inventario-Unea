// src/types/index.ts
export interface Database {
  name: string;
  lastModified: string;
  size: string;
  fileName: string;
  status: "active" | "inactive";
  path?: string;
}
