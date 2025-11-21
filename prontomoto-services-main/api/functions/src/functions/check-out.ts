// src/functions/check-out.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

type Body = { employeeId?: string };

export async function checkOut(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.employeeId) return { status: 400, jsonBody: { error: "employeeId required" } };

    const employeeId = body.employeeId;
    const today = new Date().toISOString().slice(0, 10);

    const updateQuery = `
      UPDATE attendance_logs
      SET 
        check_out_ts = now(),
        worked_minutes = COALESCE(EXTRACT(EPOCH FROM (now() - check_in_ts)) / 60, 0)
      WHERE employee_id = $1
        AND date = $2
      RETURNING id, check_in_ts, check_out_ts, worked_minutes;
    `;

    const { rows } = await pool.query(updateQuery, [employeeId, today]);
    if (rows.length === 0) {
      return { status: 404, jsonBody: { ok: false, message: "No active check-in found for today. Please check in first." } };
    }

    await pool.query(`UPDATE employee_status SET presence = 'out', last_seen_ts = now() WHERE employee_id = $1`, [employeeId]);

    const empRes = await pool.query(`SELECT emp_code, first_name, last_name, photo_url FROM employees WHERE id = $1`, [employeeId]);
    const emp = empRes.rows[0] || {};

    // optional broadcast
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
          presence: "out",
          last_seen_ts: new Date().toISOString(),
          last_session: {
            date: today,
            check_in_ts: rows[0].check_in_ts,
            check_out_ts: rows[0].check_out_ts,
            worked_minutes: Math.round(rows[0].worked_minutes),
          }
        }).catch((e: any) => console.warn("SignalR send failed:", String(e)));
      }
    } catch (bErr) {
      console.warn("SignalR broadcast attempt failed:", String(bErr));
    }

    const record = rows[0];
    return {
      status: 200,
      jsonBody: {
        ok: true,
        employeeId,
        date: today,
        check_in_ts: record.check_in_ts,
        check_out_ts: record.check_out_ts,
        worked_minutes: Math.round(record.worked_minutes),
      },
    };
  } catch (err: any) {
    console.error("check-out error:", err);
    return { status: 500, jsonBody: { error: "Failed to check out", details: String(err) } };
  }
}

app.http("check-out", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "check-out",
  handler: checkOut,
});
