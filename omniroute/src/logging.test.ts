import assert from "node:assert/strict";
import { once } from "node:events";
import { PassThrough } from "node:stream";
import { test } from "node:test";
import pino from "pino";

import { loggerOptions, resolveLogLevel } from "./logging";

test("uses info for missing and invalid log levels", () => {
	assert.equal(resolveLogLevel(undefined), "info");
	assert.equal(resolveLogLevel("verbose"), "info");
});

test("accepts supported log levels", () => {
	assert.equal(resolveLogLevel("debug"), "debug");
	assert.equal(resolveLogLevel("fatal"), "fatal");
});

test("redacts sensitive fields including nested values", async () => {
	const stream = new PassThrough();
	let output = "";
	stream.on("data", (chunk: Buffer) => { output += chunk.toString(); });
	const logger = pino({ ...loggerOptions, level: "info" }, stream);
	const flushed = once(stream, "finish");
	logger.info({ token: "top-secret", nested: { password: "hidden", authorization: "Bearer hidden" } }, "diagnostic");
	logger.flush();
	stream.end();
	await flushed;

	assert.match(output, /\[Redacted\]/);
	assert.doesNotMatch(output, /top-secret|hidden/);
});
