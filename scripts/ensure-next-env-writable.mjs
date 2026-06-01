#!/usr/bin/env node
import { chmodSync, existsSync } from "node:fs"
import { resolve } from "node:path"

const path = resolve("next-env.d.ts")
if (existsSync(path)) {
  try {
    chmodSync(path, 0o666)
  } catch {
    // Some Windows workspaces lock this file. Next can still start if it does not need to rewrite it.
  }
}
