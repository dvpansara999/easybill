#!/usr/bin/env node
import {
  assertAccountMatches,
  createAdmin,
  readEnv,
  resetAndSeed,
} from "./dev-workspace-core.mjs"

const includeSecondary = process.argv.includes("--include-secondary")

async function main() {
  const env = readEnv()
  const admin = createAdmin(env)
  await assertAccountMatches(admin, env.primary, "Primary")
  await resetAndSeed(admin, env.primary, { kind: "primary" })
  console.log(`Seeded primary dev workspace: ${env.primary.email} (${env.primary.userId})`)

  if (includeSecondary) {
    await assertAccountMatches(admin, env.secondary, "Secondary")
    await resetAndSeed(admin, env.secondary, { kind: "secondary" })
    console.log(`Seeded secondary isolation workspace: ${env.secondary.email} (${env.secondary.userId})`)
  } else {
    console.log("Secondary isolation workspace was not mutated. Pass --include-secondary to seed it explicitly.")
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
