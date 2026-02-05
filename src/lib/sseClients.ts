// src/lib/sseClients.ts
export const sseClients = new Map<
  string,
  {
    write: (data: string) => void;
    end: () => void;
    pollTimer: NodeJS.Timeout;
    keepAlive?: NodeJS.Timeout;
  }
>();