// api/lib/db.ts — CommonJS compatible (api/ uses "type": "commonjs")
import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = neon(DATABASE_URL);

export async function ensureSchema(): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id            SERIAL PRIMARY KEY,
      email         TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username      TEXT,
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS problems (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      problem_id    TEXT NOT NULL,
      title         TEXT NOT NULL,
      slug          TEXT NOT NULL,
      difficulty    TEXT NOT NULL,
      tags          TEXT[] DEFAULT '{}',
      companies     TEXT[] DEFAULT '{}',
      url           TEXT DEFAULT '',
      language      TEXT DEFAULT '',
      code          TEXT DEFAULT '',
      runtime       TEXT DEFAULT '',
      memory        TEXT DEFAULT '',
      solved_at     BIGINT DEFAULT 0,
      time_spent_ms BIGINT DEFAULT 0,
      notes         TEXT DEFAULT '',
      pattern       TEXT DEFAULT '',
      mistake       TEXT DEFAULT '',
      observation   TEXT DEFAULT '',
      UNIQUE(user_id, problem_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS revisions (
      id                  SERIAL PRIMARY KEY,
      user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      problem_id          TEXT NOT NULL,
      scheduled_dates     BIGINT[] DEFAULT '{}',
      next_revision_index INTEGER DEFAULT 0,
      history             JSONB DEFAULT '[]',
      UNIQUE(user_id, problem_id)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS journals (
      id            SERIAL PRIMARY KEY,
      user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date          TEXT NOT NULL,
      problem_ids   TEXT[] DEFAULT '{}',
      total_time_ms BIGINT DEFAULT 0,
      UNIQUE(user_id, date)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_settings (
      id              SERIAL PRIMARY KEY,
      user_id         INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      github_token    TEXT DEFAULT '',
      github_username TEXT DEFAULT '',
      github_repo     TEXT DEFAULT 'leetcode-solutions',
      ai_provider     TEXT DEFAULT 'none',
      openai_key      TEXT DEFAULT '',
      groq_key        TEXT DEFAULT ''
    )
  `;
}
