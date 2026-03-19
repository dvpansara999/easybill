export async function runSeedAndScopeMigration() {
  // Supabase migration:
  // The old local "seed account + global-to-scoped" migration is no longer needed once auth + data are cloud-backed.
  // We keep this function as a no-op because the home page still calls it.
  return
}

