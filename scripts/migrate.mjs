import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import nextEnv from "@next/env"
import pg from "pg"

const { loadEnvConfig } = nextEnv
const { Pool } = pg
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
loadEnvConfig(projectRoot)

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to run database migrations.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `)

  const migrationDirectory = path.join(projectRoot, "scripts", "migrations")
  const migrations = (await readdir(migrationDirectory))
    .filter((name) => name.endsWith(".sql"))
    .sort()

  for (const name of migrations) {
    const client = await pool.connect()
    try {
      await client.query("BEGIN")
      const alreadyApplied = await client.query(
        "SELECT 1 FROM schema_migrations WHERE name = $1",
        [name],
      )
      if (alreadyApplied.rowCount) {
        await client.query("COMMIT")
        console.info(`Already applied: ${name}`)
        continue
      }

      const sql = await readFile(path.join(migrationDirectory, name), "utf8")
      await client.query(sql)
      await client.query("INSERT INTO schema_migrations(name) VALUES ($1)", [name])
      await client.query("COMMIT")
      console.info(`Applied: ${name}`)
    } catch (error) {
      await client.query("ROLLBACK")
      throw new Error(`Migration ${name} failed. Transaction rolled back.`, { cause: error })
    } finally {
      client.release()
    }
  }
} finally {
  await pool.end()
}
