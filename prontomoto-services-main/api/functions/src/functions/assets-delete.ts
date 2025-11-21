import { app, HttpRequest } from "@azure/functions";
import { pool } from "../shared/db";

export async function assetsDelete(req: HttpRequest) {
  try {
    const assetId = req.params["id"]; // ✅ Get asset id from URL
    if (!assetId) {
      return { status: 400, jsonBody: { error: "Asset ID is required" } };
    }

    await pool.query(`DELETE FROM employee_assets WHERE id = $1`, [assetId]);

    return { jsonBody: { success: true } };
  } catch (err) {
    return {
      status: 500,
      jsonBody: { error: "Failed to delete asset", details: String(err) }
    };
  }
}

app.http("assets-delete", {
  route: "assets/{id}",
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: assetsDelete
});
