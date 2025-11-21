import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";
import { randomUUID } from "crypto";

interface AssetBody {
  employee_id: string;
  item_name: string;
  item_code?: string;
  issued_on?: string;
  notes?: string;
}

export async function assetsAdd(req: HttpRequest) {
  try {
    const body = (await req.json()) as Partial<AssetBody>; // ✅ safe cast

    if (!body.employee_id || !body.item_name) {
      return {
        status: 400,
        jsonBody: { error: "employee_id and item_name are required" }
      };
    }

    const id = randomUUID();
    await pool.query(
      `INSERT INTO employee_assets (id, employee_id, item_name, item_code, issued_on, status, notes)
       VALUES ($1,$2,$3,$4,$5,'issued',$6)`,
      [
        id,
        body.employee_id,
        body.item_name,
        body.item_code || null,
        body.issued_on || null,
        body.notes || null
      ]
    );

    return { jsonBody: { success: true, id } };
  } catch (err) {
    return {
      status: 500,
      jsonBody: { error: "Failed to add asset", details: String(err) }
    };
  }
}

app.http("assets-add", {
  route: "assets",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: assetsAdd
});
