import type { QuotaState } from "./quota-service";
import { quotaRenderModel } from "./quota-display/model";
import { textSvg } from "./quota-display/text";
import { resolvePresentation } from "./quota-display/catalog";
import { resolveColorScheme } from "./quota-display/color-schemes";

export { quotaRenderModel } from "./quota-display/model";
export type { QuotaRenderModel } from "./quota-display/model";

export function quotaSvg(model: import("./quota-display/model").QuotaRenderModel): string {
	return textSvg(model);
}

export function quotaImage(state: QuotaState, connectionId: unknown, presentation?: unknown, displayName?: unknown, colorScheme?: unknown): string {
	return `data:image/svg+xml;base64,${Buffer.from(resolvePresentation(presentation).render(quotaRenderModel(state, connectionId, displayName), resolveColorScheme(colorScheme))).toString("base64")}`;
}
