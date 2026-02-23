import { config } from "./config";

export function log(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) {
  if (shouldLog(level)) {
    const output = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}`;
    if (meta) {
      // eslint-disable-next-line no-console
      console[level](output, meta);
    } else {
      // eslint-disable-next-line no-console
      console[level](output);
    }
  }
}

function shouldLog(level: string) {
  const levels = ["error", "warn", "info"];
  const current = levels.indexOf(config.logLevel);
  const incoming = levels.indexOf(level);
  return incoming <= current;
}
