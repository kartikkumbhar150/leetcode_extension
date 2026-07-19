// api/revisions/index.ts
// GET  /api/revisions — fetch all revision entries for the user
// POST /api/revisions — upsert a revision entry

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, ensureSchema } from "../lib/db";
import { getUserFromRequest, setCors } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  await ensureSchema();

  if (req.method === "GET") {
    try {
      const rows = await sql`
        SELECT * FROM revisions WHERE user_id = ${user.userId}
      `;
      const revisions = rows.reduce((acc: Record<string, unknown>, row) => {
        acc[row.problem_id] = {
          problemId: row.problem_id,
          scheduledDates: (row.scheduled_dates as number[]).map(Number),
          nextRevisionIndex: row.next_revision_index,
          history: row.history,
        };
        return acc;
      }, {});
      return res.status(200).json({ revisions });
    } catch (err) {
      console.error("[GET /revisions]", err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { problemId, scheduledDates, nextRevisionIndex, history } = req.body as {
        problemId: string;
        scheduledDates: number[];
        nextRevisionIndex: number;
        history: unknown[];
      };

      await sql`
        INSERT INTO revisions (user_id, problem_id, scheduled_dates, next_revision_index, history)
        VALUES (
          ${user.userId}, ${problemId}, ${scheduledDates},
          ${nextRevisionIndex}, ${JSON.stringify(history)}
        )
        ON CONFLICT (user_id, problem_id) DO UPDATE SET
          scheduled_dates = EXCLUDED.scheduled_dates,
          next_revision_index = EXCLUDED.next_revision_index,
          history = EXCLUDED.history
      `;
      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error("[POST /revisions]", err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
