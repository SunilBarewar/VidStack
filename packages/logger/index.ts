import * as HyperDX from "@hyperdx/node-opentelemetry";
import winston from "winston";

export { winston };

export type ILogger = winston.Logger;

const logLevel = process.env.LOG_LEVEL ?? "info";

export function createLogger({
  name,
  hyperdxApiKey,
  node_env = "dev",
}: {
  name: string;
  hyperdxApiKey?: string;
  node_env?: "dev" | "staging" | "production";
}): ILogger {
  console.log("[Create Logger] NODE_ENV", process.env.NODE_ENV);
  const service = `${name}-${node_env ?? "dev"}`;

  const prettyError = (error: Error) => ({
    ...error,
    stack: error.stack,
    message: error.message,
  });

  const errorFormatter = winston.format((info) => {
    if (info.error instanceof Error) {
      return {
        ...info,
        error: prettyError(info.error),
      };
    }
    if (info instanceof Error) {
      return {
        ...info,
        ...prettyError(info),
      };
    }
    return info;
  });

  const sensitiveKeys = [
    "password",
    "token",
    "secret",
    "authorization",
    "apiKey",
  ];

  const redactSensitiveInfo = winston.format((info) => {
    const redactObject = (obj: any): any => {
      if (!obj || typeof obj !== "object") return obj;

      return Object.keys(obj).reduce((acc, key) => {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some((k) => lowerKey.includes(k))) {
          acc[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object") {
          if (obj[key] instanceof Date) {
            acc[key] = obj[key].toISOString();
          } else {
            acc[key] = redactObject(obj[key]);
          }
        } else {
          acc[key] = obj[key];
        }
        return acc;
      }, {} as any);
    };

    return Object.assign({}, info, redactObject(info));
  });

  const format = winston.format.combine(
    errorFormatter(),
    redactSensitiveInfo(),
    winston.format.json(),
  );

  const transports: winston.transport[] = [new winston.transports.Console()];

  if (hyperdxApiKey) {
    transports.push(
      HyperDX.getWinstonTransport(logLevel, {
        detectResources: true,
        service,
      }),
    );
  }

  const logger = winston.createLogger({
    defaultMeta: { service },
    level: logLevel,
    format,
    transports,
    silent: node_env === "staging",
    // Add ISO levels of logging from PINO
    levels: Object.assign(
      { fatal: 0, warn: 4, trace: 7 },
      winston.config.syslog.levels,
    ),
  });

  return logger;
}
