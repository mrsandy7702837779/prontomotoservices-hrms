// src/functions/check-in.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";
import { randomUUID } from "crypto";

type Body = { employeeId?: string };

export async function checkIn(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.employeeId) return { status: 400, jsonBody: { error: "employeeId required" } };

    const employeeId = body.employeeId;
    const today = new Date().toISOString().slice(0, 10);
    const id = randomUUID();

    // Upsert attendance row (requires unique constraint on (employee_id, date))
    const insertAttendance = `
      INSERT INTO attendance_logs (id, employee_id, date, check_in_ts, worked_minutes)
      VALUES ($1, $2, $3, now(), 0)
      ON CONFLICT (employee_id, date)
      DO UPDATE SET check_in_ts = EXCLUDED.check_in_ts;
    `;
    await pool.query(insertAttendance, [id, employeeId, today]);

    // Upsert presence
    const updateStatus = `
      INSERT INTO employee_status (employee_id, presence, last_seen_ts)
      VALUES ($1, 'in', now())
      ON CONFLICT (employee_id)
      DO UPDATE SET presence = 'in', last_seen_ts = now();
    `;
    await pool.query(updateStatus, [employeeId]);

    // fetch employee minimal info
    const empRes = await pool.query(
      `SELECT emp_code, first_name, last_name, photo_url FROM employees WHERE id = $1`,
      [employeeId]
    );
    const emp = empRes.rows[0] || {};

    // optional broadcast (dynamically import)
    try {
      const mod = await import("../shared/signalr").catch(() => null);
      const sendSignalrMessage = mod?.sendSignalrMessage;
      if (typeof sendSignalrMessage === "function") {
        await sendSignalrMessage("pms-hub", "presenceChanged", {
          employee_id: employeeId,
          emp_code: emp.emp_code || null,
          first_name: emp.first_name || null,
          last_name: emp.last_name || null,
          photo_url: emp.photo_url || null,
          presence: "in",
          last_seen_ts: new Date().toISOString(),
        }).catch((e: any) => console.warn("SignalR send failed:", String(e)));
      }
    } catch (bErr) {
      console.warn("SignalR broadcast attempt failed:", String(bErr));
    }

    const { rows } = await pool.query(`SELECT check_in_ts FROM attendance_logs WHERE employee_id = $1 AND date = $2`, [employeeId, today]);

    return { status: 200, jsonBody: { ok: true, employeeId, date: today, check_in_ts: rows[0]?.check_in_ts || new Date().toISOString() } };
  } catch (err: any) {
    console.error("check-in error:", err);
    // If ON CONFLICT failed because unique index missing, surface helpful message
    const msg = String(err);
    if (msg.includes("there is no unique or exclusion constraint")) {
      return { status: 500, jsonBody: { error: "DB schema issue: unique constraint on (employee_id,date) missing for attendance_logs", details: msg } };
    }
    return { status: 500, jsonBody: { error: "Failed to check in", details: String(err) } };
  }
}

app.http("check-in", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "check-in",
  handler: checkIn,
});
