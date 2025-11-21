import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export async function employeeLoginsPost(req: HttpRequest) {
  try {
    const body = (await req.json()) as {
      employee_id: string;
      username: string;
      password: string;
    };

    if (!body.employee_id || !body.username || !body.password) {
      return { status: 400, jsonBody: { error: "All fields required" } };
    }

    const hash = await bcrypt.hash(body.password, 10);
    const id = randomUUID();

    await pool.query(
      `
      INSERT INTO employee_logins (id, employee_id, username, password_hash)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (employee_id)
      DO UPDATE SET username = EXCLUDED.username,
                    password_hash = EXCLUDED.password_hash,
                    updated_at = now()
      `,
      [id, body.employee_id, body.username, hash]
    );

    return { status: 200, jsonBody: { success: true } };
  } catch (err: any) {
    console.error(err);
    return { status: 500, jsonBody: { error: err.message } };
  }
}

app.http("employee-logins-post", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "employee-logins",
  handler: employeeLoginsPost,
});
