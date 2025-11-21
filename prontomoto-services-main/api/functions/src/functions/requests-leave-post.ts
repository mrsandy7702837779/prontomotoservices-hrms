// src/functions/requests-leave-post.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";
import { randomUUID } from "crypto";

type Body = {
  employee_id?: string;
  start_date?: string; // YYYY-MM-DD or ISO
  end_date?: string;
  reason?: string;
};

function toYMD(d: string) {
  // Convert input (ISO or date) to YYYY-MM-DD (no timezone)
  try {
    return new Date(d).toISOString().slice(0, 10);
  } catch {
    return d;
  }
}

export async function requestsLeavePost(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;

    if (!body.employee_id) return { status: 400, jsonBody: { error: "employee_id required" } };
    if (!body.start_date) return { status: 400, jsonBody: { error: "start_date required" } };
    if (!body.end_date) return { status: 400, jsonBody: { error: "end_date required" } };

    const start = toYMD(body.start_date);
    const end = toYMD(body.end_date);

    // Validate ordering
    if (new Date(start) > new Date(end)) {
      return { status: 400, jsonBody: { error: "start_date must be <= end_date" } };
    }

    const id = randomUUID();
    const payload = {
      start_date: start,
      end_date: end,
      reason: body.reason ?? "",
    };

    // Insert into requests (pending)
    await pool.query(
      `INSERT INTO requests (id, type, employee_id, payload, status, created_at)
       VALUES ($1, 'leave', $2, $3::jsonb, 'pending', NOW())`,
      [id, body.employee_id, JSON.stringify(payload)]
    );

    // Return useful created object for frontend optimistic update
    return {
      status: 201,
      jsonBody: {
        ok: true,
        request: {
          id,
          type: "leave",
          employee_id: body.employee_id,
          payload,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      },
    };
  } catch (err: any) {
    console.error("requests-leave-post error:", err);
    return { status: 500, jsonBody: { error: "server error", details: String(err) } };
  }
}

app.http("requests-leave-post", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "requests/leave",
  handler: requestsLeavePost,
});
