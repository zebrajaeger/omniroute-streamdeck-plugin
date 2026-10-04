import pino, { type Logger, type LoggerOptions } from "pino";

const levels = ["fatal", "error", "warn", "info", "debug", "trace"] as const;
type LogLevel = (typeof levels)[number];

/** Resolve the configured Pino threshold, falling back safely to info. */
export function resolveLogLevel(value: string | undefined): LogLevel {
	return levels.includes(value as LogLevel) ? (value as LogLevel) : "info";
}

const sensitiveField = "[Redacted]";
export const loggerOptions: LoggerOptions = {
	level: resolveLogLevel(process.env.OMNIROUTE_LOG_LEVEL),
	redact: {
		paths: [
			"password", "*.password", "**.password",
			"passwd", "*.passwd", "**.passwd",
			"token", "*.token", "**.token",
			"accessToken", "*.accessToken", "**.accessToken",
			"refreshToken", "*.refreshToken", "**.refreshToken",
			"apiKey", "*.apiKey", "**.apiKey",
			"authorization", "*.authorization", "**.authorization",
			"Authorization", "*.Authorization", "**.Authorization",
		],
		censor: sensitiveField,
	},
};

/** Central plugin-owned structured logger. SDK logs remain independent. */
export const logger: Logger = pino(loggerOptions);
