// src/functions/admin-logins.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";
import * as bcrypt from "bcryptjs";

export async function adminLogins(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_logins (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    if (req.method === "GET") {
      const { rows } = await pool.query(
        "SELECT username, created_at FROM admin_logins ORDER BY id DESC LIMIT 1"
      );
      return { status: 200, jsonBody: rows };
    }

    if (req.method === "POST") {
      // cast to any so TS knows we can access props
      const body = (await req.json()) as any;
      const username = body?.username;
      const password = body?.password;

      if (!username || !password) {
        return { status: 400, jsonBody: { error: "username and password required" } };
      }

      const hash = await bcrypt.hash(password, 10);

      await pool.query(
        `
        INSERT INTO admin_logins (username, password_hash)
        VALUES ($1, $2)
        ON CONFLICT (username)
        DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()
        `,
        [username, hash]
      );

      return { status: 200, jsonBody: { ok: true, message: "Admin credentials saved." } };
    }

    return { status: 405, jsonBody: { error: "Method not allowed" } };
  } catch (err: any) {
    console.error("admin-logins error:", err);
    return { status: 500, jsonBody: { error: "Server error", details: String(err) } };
  }
}

app.http("root-admin-logins", {
  route: "root-admin-logins",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: adminLogins,
});
