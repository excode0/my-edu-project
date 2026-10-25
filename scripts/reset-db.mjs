import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import nextEnv from "@next/env"
import pg from "pg"

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
nextEnv.loadEnvConfig(projectRoot)

const confirmedDatabase = process.argv[2]
if (!confirmedDatabase) {
  throw new Error("Pass the exact database name to confirm the destructive reset.")
}
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to reset the database.")
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
let target
try {
  const result = await pool.query(
    "SELECT current_database() AS database, inet_server_addr()::text AS host",
  )
  target = result.rows[0]
  if (target.database !== confirmedDatabase) {
    throw new Error(`Reset confirmation does not match connected database "${target.database}".`)
  }
  const host = target.host?.split("/")[0]
  if (host !== "127.0.0.1" && host !== "::1") {
    throw new Error(`Refusing reset on non-local database host "${target.host ?? "unknown"}".`)
  }

  await pool.query("DROP SCHEMA public CASCADE")
  await pool.query("CREATE SCHEMA public AUTHORIZATION CURRENT_USER")
  console.info(`Reset public schema in local database "${target.database}".`)
} finally {
  await pool.end()
}

const migration = spawnSync(
  process.execPath,
  [path.join(projectRoot, "scripts", "migrate.mjs")],
  { cwd: projectRoot, env: process.env, stdio: "inherit" },
)
if (migration.error) throw migration.error
if (migration.status !== 0) process.exitCode = migration.status ?? 1
