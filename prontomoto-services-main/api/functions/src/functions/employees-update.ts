// imports unchanged
import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";

type UpdateBody = {
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  address?: string;
  dob?: string;
  join_date?: string;
  marital_status?: string;
  marriage_date?: string;
  blood_group?: string;
  emergency_name?: string;
  emergency_mobile?: string;
  job_title?: string;
  department?: string;
  grad_college?: string;
  grad_degree?: string;
  grad_year?: number;
  inter_college?: string;
  inter_course?: string;
  inter_year?: number;
  photo_url?: string;
};

// Build dynamic query (no change)
function buildUpdateQuery(id: string, data: UpdateBody) {
  const fields = Object.keys(data);
  if (fields.length === 0) return null;

  const setClauses = fields.map((k, i) => `${k} = $${i + 2}`); // $2, $3, ...
  const values = fields.map((k) => (data as any)[k]);

  return {
    text: `UPDATE employees SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`,
    values: [id, ...values],
  };
}

// helper to normalize date-type fields to YYYY-MM-DD strings
function normalizeDateFields(row: any) {
  if (!row) return row;
  const dateFields = ["dob", "join_date", "marriage_date"];
  for (const f of dateFields) {
    const v = row[f];
    if (v instanceof Date) {
      // convert UTC-based Date -> YYYY-MM-DD (no timezone effect)
      row[f] = v.toISOString().slice(0, 10);
    } else if (typeof v === "string" && v.length >= 10 && v[4] === "-" && v[7] === "-") {
      // already YYYY-MM-DD or ISO-like string — normalize to first 10 chars
      row[f] = v.slice(0, 10);
    } else {
      // leave as-is (null/undefined)
    }
  }
  return row;
}


export async function updateEmployee(req: HttpRequest) {
  try {
    const id = req.params.id;
    if (!id) {
      return { status: 400, jsonBody: { error: "Employee id is required" } };
    }

    const body = (await req.json()) as UpdateBody;
    const query = buildUpdateQuery(id, body);

    if (!query) {
      return { status: 400, jsonBody: { error: "No fields provided to update" } };
    }

    const result = await pool.query(query.text, query.values);
    if (!result.rowCount) {
      return { status: 404, jsonBody: { error: "Employee not found" } };
    }

    const row = normalizeDateFields(result.rows[0]);
    
    return { jsonBody: { success: true, employee: row } };
  } catch (err) {
    console.error("Update error:", err);
    return { status: 500, jsonBody: { error: "Failed to update employee", details: String(err) } };
  }
}

app.http("employees-update", {
  route: "employees/{id}",
  methods: ["PATCH"],
  authLevel: "anonymous",
  handler: updateEmployee,
});
