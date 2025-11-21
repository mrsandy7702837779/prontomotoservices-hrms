// src/functions/profilechange-post.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";
import { randomUUID } from "crypto";

export async function profileChangePost(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      employee_id?: string;
      field?: string;
      old_value?: string;
      new_value?: string;
    };

    const { employee_id, field, old_value, new_value } = body;

    if (!employee_id || !field || !new_value) {
      return {
        status: 400,
        jsonBody: { error: "employee_id, field and new_value are required" },
      };
    }

    const payload = {
      field_name: field,
      old_value: old_value ?? null,
      new_value,
    };

    const id = randomUUID();

    const { rows } = await pool.query(
      `INSERT INTO requests (id, type, employee_id, payload, status, created_at)
       VALUES ($1, 'profile', $2, $3::jsonb, 'pending', now())
       RETURNING id`,
      [id, employee_id, JSON.stringify(payload)]
    );

    return {
      status: 200,
      jsonBody: { ok: true, message: "Profile change request created", id: rows[0].id },
    };
  } catch (err: any) {
    console.error("profileChangePost error:", err);
    return { status: 500, jsonBody: { error: err.message || "Server error" } };
  }
}

app.http("profilechange-post", {
  route: "requests/profile-change",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: profileChangePost,
});
