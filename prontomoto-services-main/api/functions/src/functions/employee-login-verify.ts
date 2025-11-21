import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";
import bcrypt from "bcrypt";

export async function employeeLoginVerify(req: HttpRequest) {
  try {
    const body = (await req.json()) as { username: string; password: string };
    const { username, password } = body;

    if (!username || !password)
      return { status: 400, jsonBody: { error: "Username and password required" } };

    const { rows } = await pool.query(
      `
      SELECT e.id AS employee_id, e.first_name, e.last_name, l.password_hash
      FROM employee_logins l
      JOIN employees e ON e.id = l.employee_id
      WHERE l.username = $1
      `,
      [username]
    );

    if (!rows.length)
      return { status: 401, jsonBody: { error: "Invalid username or password" } };

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid)
      return { status: 401, jsonBody: { error: "Invalid username or password" } };

    return {
      status: 200,
      jsonBody: {
        employee_id: rows[0].employee_id,
        employee_name: `${rows[0].first_name} ${rows[0].last_name}`,
      },
    };
  } catch (err: any) {
    console.error(err);
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("employee-login-verify", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "employee-login-verify",
  handler: employeeLoginVerify,
});
