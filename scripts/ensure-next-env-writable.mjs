#!/usr/bin/env node
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const path = resolve("next-env.d.ts")
if (existsSync(path)) {
  try {
    chmodSync(path, 0o666)
  } catch {
    // Some Windows workspaces lock this file. Next can still start if it does not need to rewrite it.
  }
}

const distDir = process.env.NEXT_DIST_DIR
if (distDir && existsSync(path)) {
  const normalizedDistDir = distDir.replaceAll("\\", "/").replace(/^\.\//, "")
  const content = [
    '/// <reference types="next" />',
    '/// <reference types="next/image-types/global" />',
    `import "./${normalizedDistDir}/dev/types/routes.d.ts";`,
    "",
    "// NOTE: This file should not be edited",
    "// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.",
    "",
  ].join("\r\n")

  try {
    if (readFileSync(path, "utf8") !== content) {
      writeFileSync(path, content)
    }
  } catch {
    // If this workspace locks next-env.d.ts, leave it alone. The dev server will still skip rewriting
    // when the file already matches the expected Playwright type import.
  }
}
