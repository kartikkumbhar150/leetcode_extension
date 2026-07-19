// api/auth/signup.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql, ensureSchema } from "../lib/db";
import { hashPassword, signToken, setCors } from "../lib/auth";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await ensureSchema();

    const { email, password, username } = req.body as {
      email: string;
      password: string;
      username?: string;
    };

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Check if email already exists
    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: "An account with this email already exists" });
    }

    const passwordHash = await hashPassword(password);

    // Create user
    const rows = await sql`
      INSERT INTO users (email, password_hash, username)
      VALUES (${email.toLowerCase()}, ${passwordHash}, ${username || null})
      RETURNING id, email, username, created_at
    `;
    const user = rows[0];

    // Create default settings row
    await sql`
      INSERT INTO user_settings (user_id) VALUES (${user.id})
      ON CONFLICT (user_id) DO NOTHING
    `;

    const token = signToken({ userId: user.id, email: user.email });

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, username: user.username },
    });
  } catch (err) {
    console.error("[signup]", err);
    return res.status(500).json({ error: "Server error. Please try again." });
  }
}
