export function shorten(text: string, limit: number): string {
	const chars = Array.from(text.replace(/[\u0000-\u001f\u007f-\u009f]/g, " "));
	return chars.length <= limit ? chars.join("") : chars.slice(0, limit - 1).join("") + "…";
}

function escapeXml(value: string): string {
	return value.replace(/[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/gu, "�")
		.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function text(value: string, x: number, y: number, size: number, width: number, anchor = "start"): string {
	return `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}" textLength="${Math.min(width, Array.from(value).length * size * 0.65)}" lengthAdjust="spacingAndGlyphs">${escapeXml(value)}</text>`;
}

export function svg(body: string): string {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 72 72"><rect width="72" height="72" rx="6" fill="#111827"/><g fill="#f9fafb" font-family="Arial, sans-serif">${body}</g></svg>`;
}
