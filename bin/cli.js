#!/usr/bin/env node
import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const cwd = process.cwd(); // user project root

// ensure dist exists in the user project
const distDir = path.join(cwd, "dist");

if (!fs.existsSync(distDir))
	fs.mkdirSync(distDir, { recursive: true });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const bin = (name) => `npx ${name}`;

const libSrc = path.join(__dirname, "../src/msga");
const userSrc = path.join(cwd, "src");

const concurrently = bin("concurrently");

const msgaLib = `${bin("cpx")} "${path.join(libSrc, "**/*.js")}" ${path.join(distDir, "src/msga")} --watch`;
const tailwindLib = `${bin("tailwindcss")} -i ${path.join(libSrc, "msga.css")} -o ${path.join(distDir, "src/msga/msga.css")} --config "${path.join(__dirname, '../tailwind.config.js')}" --watch`;

const swcApp = `${bin("swc")} "${path.join(userSrc, "*.jsx")}" "${path.join(userSrc, "**/*.jsx")}" -d "${distDir}" --config-file "${path.join(__dirname,'../.swcrc')}" --watch`;

const cpxHtmlCss = `${bin("cpx")} "${path.join(userSrc, "*.{html,css}")}" "${distDir}/src" --watch`;
const cpxAssets = `${bin("cpx")} "${path.join(userSrc, "assets/**/*")}" "${distDir}/src/assets" --watch`;

const viteCmd = `${bin("vite")} --config ${path.join(__dirname,'../vite.config.js')}`;

// parse CLI command
const command = process.argv[2] || "dev";

switch (command) {
	case "dev":
		execSync(`${concurrently} -n tailwind,swc,html,assets,library,vite \
			-c "magenta,blue,green,orange,yellow,cyan" \
			"${tailwindLib}" "${swcApp}" "${cpxHtmlCss}" "${cpxAssets}" "${msgaLib}" "${viteCmd}"`, { stdio: "inherit" }
		);

		break;
	default:
		console.log(`
      Usage:
        msga dev     Start dev server (watch mode)
    `);
}
