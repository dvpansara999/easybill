#!/usr/bin/env node
import { createAdmin, ensureAuthAccount, readEnv } from "./dev-workspace-core.mjs"

async function main() {
  const env = readEnv()
  const admin = createAdmin(env)
  const primary = await ensureAuthAccount(admin, env.primary, "primary")
  const secondary = await ensureAuthAccount(admin, env.secondary, "secondary")

  console.log("Development workspace accounts are present:")
  console.log(`- Primary: ${primary.email} (${primary.id})`)
  console.log(`- Secondary: ${secondary.email} (${secondary.id})`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
