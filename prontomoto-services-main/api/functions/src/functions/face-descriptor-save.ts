// src/functions/face-descriptor-save.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function faceDescriptorSave(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    if (req.method !== "POST") return { status: 405, jsonBody: { error: "Method not allowed" } };

    const body = (await req.json()) as { employee_id?: string; descriptor?: number[] };

    if (!body || !body.employee_id || !Array.isArray(body.descriptor)) {
      return { status: 400, jsonBody: { error: "employee_id and descriptor array required" } };
    }

    // Optional: basic validation length
    if (body.descriptor.length < 64 || body.descriptor.length > 512) {
      console.warn("face descriptor length suspicious:", body.descriptor.length);
    }

    // Save descriptor as jsonb
    await pool.query(
      `UPDATE employees SET face_descriptor = $1 WHERE id = $2`,
      [body.descriptor, body.employee_id]
    );

    return { status: 200, jsonBody: { ok: true } };
  } catch (err: any) {
    console.error("faceDescriptorSave error:", err);
    return { status: 500, jsonBody: { error: "Server error", details: String(err) } };
  }
}

app.http("face-descriptor-save", {
  route: "face-descriptor",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: faceDescriptorSave,
});
