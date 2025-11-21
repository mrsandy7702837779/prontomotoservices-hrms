// src/functions/assetrequest-post.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";
import { randomUUID } from "crypto";

export async function assetRequestPost(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      employee_id?: string;
      asset_name?: string;
      reason?: string;
    };

    const { employee_id, asset_name, reason } = body;

    if (!employee_id || !asset_name || !reason) {
      return {
        status: 400,
        jsonBody: { error: "employee_id, asset_name and reason are required" },
      };
    }

    const payload = {
      asset_name,
      reason,
    };

    const id = randomUUID();

    const { rows } = await pool.query(
      `INSERT INTO requests (id, type, employee_id, payload, status, created_at)
       VALUES ($1, 'asset', $2, $3::jsonb, 'pending', now())
       RETURNING id`,
      [id, employee_id, JSON.stringify(payload)]
    );

    return {
      status: 200,
      jsonBody: { ok: true, message: "Asset request created", id: rows[0].id },
    };
  } catch (err: any) {
    console.error("assetRequestPost error:", err);
    return { status: 500, jsonBody: { error: err.message || "Server error" } };
  }
}

app.http("assetrequest-post", {
  route: "requests/asset",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: assetRequestPost,
});
