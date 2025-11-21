import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";
import { randomUUID } from "crypto";

type PatchBody = {
  status?: "approved" | "rejected";
  handled_by?: string | null;
  note?: string | null;
};

export async function requestsPatch(req: HttpRequest) {
  try {
    const id = req.params.id;
    if (!id) return { status: 400, jsonBody: { error: "request id required" } };

    const body = (await req.json()) as PatchBody;
    if (!body.status) return { status: 400, jsonBody: { error: "status required" } };

    // Fetch the request
    const rres = await pool.query("SELECT * FROM requests WHERE id = $1 LIMIT 1", [id]);
    if (!rres.rowCount) return { status: 404, jsonBody: { error: "request not found" } };
    const request = rres.rows[0];
    const payload = request.payload || {};

    let created: any = null;

    // Handle approval side effects
    if (body.status === "approved") {
      if (request.type === "leave") {
        const { start_date, end_date, reason } = payload;
        if (!start_date || !end_date)
          return { status: 400, jsonBody: { error: "leave payload missing dates" } };

        const leaveId = randomUUID();
        const ins = await pool.query(
          `INSERT INTO leave_requests (id, employee_id, start_date, end_date, reason, status, created_at)
           VALUES ($1,$2,$3,$4,$5,'approved',NOW()) RETURNING *`,
          [leaveId, request.employee_id, start_date, end_date, reason]
        );
        created = ins.rows[0];
      }

      else if (request.type === "profile") {
        // ✅ Correct payload parsing (field_name, new_value)
        const field = payload.field_name;
        const newVal = payload.new_value;

        if (!field || newVal === undefined || newVal === null) {
          return { status: 400, jsonBody: { error: "profile payload missing field_name or new_value" } };
        }

        const sql = `UPDATE employees SET ${field} = $2 WHERE id = $1 RETURNING *`;
        const updated = await pool.query(sql, [request.employee_id, newVal]);
        created = updated.rows[0];
      }

      else if (request.type === "asset") {
        const itemName = payload.asset_name || null;
        if (!itemName)
          return { status: 400, jsonBody: { error: "asset payload missing asset_name" } };

        const assetId = randomUUID();
        const issuedOn = payload.issued_on || new Date();
        const itemCode = payload.item_code || null;
        const notes = payload.reason || payload.notes || null;

        const ins = await pool.query(
          `INSERT INTO employee_assets (id, employee_id, item_name, item_code, issued_on, status, notes)
           VALUES ($1,$2,$3,$4,$5,'issued',$6) RETURNING *`,
          [assetId, request.employee_id, itemName, itemCode, issuedOn, notes]
        );
        created = ins.rows[0];
      }
    }

    // Mark handled
    await pool.query(
      `UPDATE requests SET status = $1, handled_by = $2, handled_at = NOW() WHERE id = $3`,
      [body.status, body.handled_by || null, id]
    );

    // Return updated record
    const fres = await pool.query(
      `SELECT r.*, e.emp_code, e.first_name, e.last_name, e.photo_url
       FROM requests r 
       LEFT JOIN employees e ON e.id = r.employee_id
       WHERE r.id = $1`,
      [id]
    );

    return { status: 200, jsonBody: { success: true, request: fres.rows[0], created } };
  } catch (err) {
    console.error("requests-patch error:", err);
    return { status: 500, jsonBody: { error: "failed to update request", details: String(err) } };
  }
}

app.http("requests-patch", {
  route: "requests/{id}",
  methods: ["PATCH"],
  authLevel: "anonymous",
  handler: requestsPatch,
});
