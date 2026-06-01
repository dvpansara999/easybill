#!/usr/bin/env node
import { createAdmin, readEnv, validateWorkspace } from "./dev-workspace-core.mjs"

async function main() {
  const env = readEnv()
  const admin = createAdmin(env)
  const result = await validateWorkspace(env, admin)

  console.log("Primary:", result.primary)
  console.log("Secondary:", result.secondary)

  if (!result.ok) {
    console.error("Development workspace health check failed:")
    for (const failure of result.failures) console.error(`- ${failure}`)
    process.exit(1)
  }

  console.log("Development workspace is healthy.")
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
