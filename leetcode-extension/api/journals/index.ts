// api/journals/index.ts
// GET  /api/journals — fetch all journal days for the user
// POST /api/journals — upsert a journal day entry

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
        SELECT * FROM journals WHERE user_id = ${user.userId} ORDER BY date DESC
      `;
      const journals = rows.reduce((acc: Record<string, unknown>, row) => {
        acc[row.date] = {
          date: row.date,
          problemIds: row.problem_ids,
          totalTimeMs: Number(row.total_time_ms),
        };
        return acc;
      }, {});
      return res.status(200).json({ journals });
    } catch (err) {
      console.error("[GET /journals]", err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  if (req.method === "POST") {
    try {
      const { date, problemIds, totalTimeMs } = req.body as {
        date: string;
        problemIds: string[];
        totalTimeMs: number;
      };

      await sql`
        INSERT INTO journals (user_id, date, problem_ids, total_time_ms)
        VALUES (${user.userId}, ${date}, ${problemIds}, ${totalTimeMs})
        ON CONFLICT (user_id, date) DO UPDATE SET
          problem_ids = EXCLUDED.problem_ids,
          total_time_ms = EXCLUDED.total_time_ms
      `;
      return res.status(201).json({ ok: true });
    } catch (err) {
      console.error("[POST /journals]", err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
