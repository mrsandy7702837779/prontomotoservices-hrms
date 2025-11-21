// src/functions/admin-login-verify.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";
import * as bcrypt from "bcryptjs";

export async function adminLoginVerify(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    if (req.method !== "POST") {
      return { status: 405, jsonBody: { error: "Method not allowed" } };
    }

    // cast to any so TS won't complain about unknown shape
    const body = (await req.json()) as any;
    const username = body?.username;
    const password = body?.password;

    if (!username || !password) {
      return { status: 400, jsonBody: { error: "Missing username or password" } };
    }

    const { rows } = await pool.query("SELECT * FROM admin_logins WHERE username = $1", [username]);

    if (!rows.length) {
      return { status: 401, jsonBody: { error: "Invalid username" } };
    }

    const admin = rows[0];
    const valid = await bcrypt.compare(password, admin.password_hash);

    if (!valid) {
      return { status: 401, jsonBody: { error: "Invalid password" } };
    }

    // success — you can return token/session data later
    return { status: 200, jsonBody: { ok: true, message: "Login successful" } };
  } catch (err: any) {
    console.error("admin-login-verify error:", err);
    return { status: 500, jsonBody: { error: "Server error", details: String(err) } };
  }
}

app.http("root-admin-verify", {
  route: "root-admin-verify",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: adminLoginVerify,
});
