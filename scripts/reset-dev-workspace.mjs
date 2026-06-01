#!/usr/bin/env node
import {
  assertAccountMatches,
  createAdmin,
  readEnv,
  resetAndSeed,
} from "./dev-workspace-core.mjs"

const secondary = process.argv.includes("--secondary")

async function main() {
  const env = readEnv()
  const admin = createAdmin(env)
  const account = secondary ? env.secondary : env.primary
  await assertAccountMatches(admin, account, secondary ? "Secondary" : "Primary")
  await resetAndSeed(admin, account, { kind: secondary ? "secondary" : "primary" })
  console.log(`Reset and reseeded ${secondary ? "secondary isolation" : "primary"} dev workspace: ${account.email} (${account.userId})`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
