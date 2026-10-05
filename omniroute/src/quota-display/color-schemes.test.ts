import assert from "node:assert/strict";
import { test } from "node:test";
import { colorSchemes, colorSchemeOptions, resolveColorScheme } from "./color-schemes";

test("stable schemes separate outer and inner accents and have a safe default", () => {
	assert.deepEqual(colorSchemeOptions().map(item => item.id), [
		"classic", "warm", "vivid", "sunset", "ocean", "forest", "royal", "ember", "orchid", "solar",
	]);
	assert.deepEqual(colorSchemes.map(({ outer, inner }) => [outer, inner]), [
		["#38bdf8", "#a78bfa"], ["#fbbf24", "#2dd4bf"], ["#a3e635", "#f472b6"],
		["#fb923c", "#c084fc"], ["#22d3ee", "#fbbf24"], ["#4ade80", "#fda4af"],
		["#818cf8", "#facc15"], ["#fb7185", "#67e8f9"], ["#e879f9", "#86efac"],
		["#fde047", "#f9a8d4"],
	]);
	assert.equal(new Set(colorSchemes.map(({ outer, inner }) => `${outer}/${inner}`)).size, 10);
	for (const scheme of colorSchemes) {
		assert.notEqual(scheme.outer, scheme.inner);
		assert.equal(resolveColorScheme(scheme.id), scheme);
	}
	for (const id of [undefined, null, 42, {}, "missing"]) assert.equal(resolveColorScheme(id), colorSchemes[0]);
});
