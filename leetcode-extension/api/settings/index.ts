// api/settings/index.ts
// GET /api/settings — fetch user's app settings
// PUT /api/settings — update user's app settings

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
      // Ensure settings row exists
      await sql`
        INSERT INTO user_settings (user_id) VALUES (${user.userId})
        ON CONFLICT (user_id) DO NOTHING
      `;
      const rows = await sql`
        SELECT * FROM user_settings WHERE user_id = ${user.userId}
      `;
      const s = rows[0];
      return res.status(200).json({
        settings: {
          githubToken: s.github_token,
          githubUsername: s.github_username,
          githubRepo: s.github_repo,
          aiProvider: s.ai_provider,
          openaiKey: s.openai_key,
          groqKey: s.groq_key,
        },
      });
    } catch (err) {
      console.error("[GET /settings]", err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { githubToken, githubUsername, githubRepo, aiProvider, openaiKey, groqKey } =
        req.body as {
          githubToken: string; githubUsername: string; githubRepo: string;
          aiProvider: string; openaiKey: string; groqKey: string;
        };

      await sql`
        INSERT INTO user_settings (user_id, github_token, github_username, github_repo, ai_provider, openai_key, groq_key)
        VALUES (${user.userId}, ${githubToken}, ${githubUsername}, ${githubRepo}, ${aiProvider}, ${openaiKey}, ${groqKey})
        ON CONFLICT (user_id) DO UPDATE SET
          github_token    = EXCLUDED.github_token,
          github_username = EXCLUDED.github_username,
          github_repo     = EXCLUDED.github_repo,
          ai_provider     = EXCLUDED.ai_provider,
          openai_key      = EXCLUDED.openai_key,
          groq_key        = EXCLUDED.groq_key
      `;
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("[PUT /settings]", err);
      return res.status(500).json({ error: "Server error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
