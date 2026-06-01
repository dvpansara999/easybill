#!/usr/bin/env node
import { spawn } from "node:child_process"
import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

loadEnvFiles()

const args = process.argv.slice(2)
const mode = valueAfter("--mode") || "local"
const projects = valuesAfter("--project")
const grep = valueAfter("--grep")
const file = valueAfter("--file")
const headed = args.includes("--headed")

const playwrightArgs = ["playwright", "test"]
if (file) playwrightArgs.push(file)
for (const project of projects) playwrightArgs.push("--project", project)
if (grep) playwrightArgs.push("--grep", grep)
if (headed) playwrightArgs.push("--headed")

const child = spawn("npx", playwrightArgs, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    PLAYWRIGHT_AUTH_MODE: mode,
  },
})

child.on("exit", (code) => process.exit(code ?? 1))

function valueAfter(name) {
  const index = args.indexOf(name)
  return index === -1 ? "" : args[index + 1] || ""
}

function valuesAfter(name) {
  const values = []
  for (let index = 0; index < args.length; index += 1) {
    if (args[index] === name && args[index + 1]) values.push(args[index + 1])
  }
  return values
}

function loadEnvFiles() {
  for (const filename of [".env.local", "env.local", ".env"]) {
    const path = resolve(filename)
    if (!existsSync(path)) continue
    const contents = readFileSync(path, "utf8")
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue
      const index = trimmed.indexOf("=")
      const key = trimmed.slice(0, index).trim()
      let value = trimmed.slice(index + 1).trim()
      if (!key || process.env[key] !== undefined) continue
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }
      process.env[key] = value
    }
  }
}
