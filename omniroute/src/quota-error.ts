export type QuotaErrorKind = "invalid-configuration" | "authentication" | "unavailable" | "http" | "invalid-response";

export class QuotaError extends Error {
	constructor(readonly kind: QuotaErrorKind, readonly status?: number) { super(kind); }
}
