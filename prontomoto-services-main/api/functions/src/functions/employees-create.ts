import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";
import { randomUUID } from "crypto";

type Body = {
  emp_code?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  address?: string;
  dob?: string;
  marital_status?: "single" | "married";
  marriage_date?: string;
  join_date?: string;
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

async function nextEmpCode(prefix = "PMS") {
  const { rows } = await pool.query(
    `SELECT emp_code FROM employees WHERE emp_code LIKE $1 ORDER BY emp_code DESC LIMIT 1`,
    [`${prefix}%`]
  );
  let n = 1;
  if (rows.length) {
    const last = String(rows[0].emp_code || "");
    const parsed = parseInt(last.replace(prefix, ""), 10);
    if (!isNaN(parsed)) n = parsed + 1;
  }
  return `${prefix}${String(n).padStart(3, "0")}`;
}

export async function employeesCreate(req: HttpRequest) {
  const client = await pool.connect();
  try {
    const b = (await req.json()) as Body;

    if (!b.first_name?.trim())
      return { status: 400, jsonBody: { error: "first_name is required" } };

    // If admin typed a code, check if it's free
    let emp_code = (b.emp_code || "").trim();
    if (emp_code) {
      const ex = await client.query(
        `SELECT 1 FROM employees WHERE emp_code = $1 LIMIT 1`,
        [emp_code]
      );
      if (ex.rowCount)
        return {
          status: 409,
          jsonBody: { error: "Employee ID already exists. Please choose another." },
        };
    } else {
      // Auto-generate until free
      for (let i = 0; i < 5; i++) {
        const candidate = await nextEmpCode("PMS");
        const ex2 = await client.query(
          `SELECT 1 FROM employees WHERE emp_code = $1 LIMIT 1`,
          [candidate]
        );
        if (!ex2.rowCount) {
          emp_code = candidate;
          break;
        }
      }
      if (!emp_code) emp_code = `PMS${Date.now()}`;
    }

    const id = randomUUID();

    const {
      first_name,
      last_name = "",
      email,
      mobile,
      address,
      dob,
      marital_status,
      marriage_date,
      join_date,
      blood_group,
      emergency_name,
      emergency_mobile,
      job_title,
      department,
      grad_college,
      grad_degree,
      grad_year,
      inter_college,
      inter_course,
      inter_year,
      photo_url,
    } = b;

    // Begin transaction
    await client.query("BEGIN");

    const insertEmp = `
      INSERT INTO employees (
        id, emp_code, first_name, last_name,
        email, mobile, address, dob,
        marital_status, marriage_date, join_date, blood_group,
        emergency_name, emergency_mobile,
        job_title, department,
        grad_college, grad_degree, grad_year,
        inter_college, inter_course, inter_year,
        photo_url, status, created_at
      ) VALUES (
        $1,$2,$3,$4,
        $5,$6,$7,$8,
        $9,$10,$11,$12,
        $13,$14,
        $15,$16,
        $17,$18,$19,
        $20,$21,$22,
        $23,'active',NOW()
      )
      RETURNING id, emp_code;
    `;

    const { rows } = await client.query(insertEmp, [
      id,
      emp_code,
      first_name.trim(),
      last_name.trim(),
      email || null,
      mobile || null,
      address || null,
      dob || null,
      marital_status || null,
      marriage_date || null,
      join_date || null,
      blood_group || null,
      emergency_name || null,
      emergency_mobile || null,
      job_title || null,
      department || null,
      grad_college || null,
      grad_degree || null,
      grad_year || null,
      inter_college || null,
      inter_course || null,
      inter_year || null,
      photo_url || null,
    ]);

    // Insert initial presence record
    await client.query(
      `INSERT INTO employee_status (employee_id, presence, last_seen_ts)
       VALUES ($1, 'out', now())
       ON CONFLICT (employee_id) DO NOTHING`,
      [id]
    );

    // Commit
    await client.query("COMMIT");
  
     const created = rows[0];
for (const f of ["dob", "join_date", "marriage_date"]) {
  const v = created[f];
  if (v instanceof Date) created[f] = v.toISOString().slice(0, 10);
  else if (typeof v === "string" && v.includes("T")) created[f] = v.slice(0, 10);
}
return { status: 201, jsonBody: created };

  } catch (err: any) {
    await pool.query("ROLLBACK");
    const t = String(err).toLowerCase();
    if (t.includes("duplicate key") && t.includes("emp_code")) {
      return {
        status: 409,
        jsonBody: { error: "Employee ID already exists. Please choose another." },
      };
    }
    return {
      status: 500,
      jsonBody: { error: "Failed to create employee", details: String(err) },
    };
  } finally {
    client.release();
  }
}

app.http("employees-create", {
  route: "employees",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: employeesCreate,
});
