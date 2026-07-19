// api/problems/index.ts
// GET  /api/problems  — fetch all problems for the authenticated user
// POST /api/problems  — upsert a problem record

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, ensureSchema } from "../lib/db";
import { getUserFromRequest, setCors } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  await ensureSchema();

  // ── GET — fetch all problems ──────────────────────────────
  if (req.method === "GET") {
    try {
      const rows = await sql`
        SELECT * FROM problems WHERE user_id = ${user.userId} ORDER BY solved_at DESC
      `;
      // Transform to the frontend ProblemRecord shape
      const problems = rows.reduce((acc: Record<string, unknown>, row) => {
        acc[row.problem_id] = {
          id: row.problem_id,
          title: row.title,
          slug: row.slug,
          difficulty: row.difficulty,
          tags: row.tags,
          companies: row.companies,
          url: row.url,
          language: row.language,
          code: row.code,
          runtime: row.runtime,
          memory: row.memory,
          solvedAt: Number(row.solved_at),
          timeSpentMs: Number(row.time_spent_ms),
          notes: row.notes,
          pattern: row.pattern,
          mistake: row.mistake,
          observation: row.observation,
        };
        return acc;
      }, {});
      return res.status(200).json({ problems });
    } catch (err) {
      console.error("[GET /problems]", err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  // ── POST — upsert a problem ───────────────────────────────
  if (req.method === "POST") {
    try {
      const p = req.body as {
        id: string; title: string; slug: string; difficulty: string;
        tags: string[]; companies: string[]; url: string; language: string;
        code: string; runtime: string; memory: string; solvedAt: number;
        timeSpentMs: number; notes: string; pattern: string;
        mistake: string; observation: string;
      };

      await sql`
        INSERT INTO problems (
          user_id, problem_id, title, slug, difficulty, tags, companies,
          url, language, code, runtime, memory, solved_at, time_spent_ms,
          notes, pattern, mistake, observation
        ) VALUES (
          ${user.userId}, ${p.id}, ${p.title}, ${p.slug}, ${p.difficulty},
          ${p.tags}, ${p.companies}, ${p.url}, ${p.language}, ${p.code},
          ${p.runtime}, ${p.memory}, ${p.solvedAt}, ${p.timeSpentMs || 0},
          ${p.notes || ""}, ${p.pattern || ""}, ${p.mistake || ""}, ${p.observation || ""}
        )
        ON CONFLICT (user_id, problem_id) DO UPDATE SET
          title = EXCLUDED.title,
          slug = EXCLUDED.slug,
          difficulty = EXCLUDED.difficulty,
          tags = EXCLUDED.tags,
          companies = EXCLUDED.companies,
          url = EXCLUDED.url,
          language = EXCLUDED.language,
          code = EXCLUDED.code,
          runtime = EXCLUDED.runtime,
          memory = EXCLUDED.memory,
          solved_at = EXCLUDED.solved_at,
          time_spent_ms = EXCLUDED.time_spent_ms,
          notes = EXCLUDED.notes,
          pattern = EXCLUDED.pattern,
          mistake = EXCLUDED.mistake,
          observation = EXCLUDED.observation
      `;

      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error("[POST /problems]", err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
