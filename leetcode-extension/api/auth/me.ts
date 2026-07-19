// api/auth/me.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "../lib/db";
import { getUserFromRequest, setCors } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const user = getUserFromRequest(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const rows = await sql`
      SELECT id, email, username, created_at FROM users WHERE id = ${user.userId}
    `;
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });
    return res.status(200).json({ user: rows[0] });
  } catch (err) {
    console.error("[me]", err);
    return res.status(500).json({ error: "Server error" });
  }
}
