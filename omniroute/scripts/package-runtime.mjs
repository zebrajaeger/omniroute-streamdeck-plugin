import { cp, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pluginRoot = path.join(projectRoot, "de.lars-brandt.omniroute.sdPlugin");
const sourceModules = path.join(projectRoot, "node_modules");
const destinationModules = path.join(pluginRoot, "node_modules");
const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8"));
const dependencies = Object.keys(packageJson.dependencies ?? {});

await rm(destinationModules, { recursive: true, force: true });
await mkdir(destinationModules, { recursive: true });

for (const dependency of dependencies) {
	const source = path.join(sourceModules, dependency);
	const destination = path.join(destinationModules, dependency);
	await mkdir(path.dirname(destination), { recursive: true });
	await cp(source, destination, {
		recursive: true,
		filter: (entry) => !entry.split(path.sep).some((part) => part === "test" || part === "tests" || part === "benchmarks" || part === ".github"),
	});
}

console.log(`Packaged runtime dependencies: ${dependencies.join(", ")}`);
