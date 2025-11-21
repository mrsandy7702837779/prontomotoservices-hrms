// src/functions/links-get.ts
import { app, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";

export async function linksGet(): Promise<HttpResponseInit> {
  try {
    const { rows } = await pool.query("SELECT id, label, url, created_at FROM company_links ORDER BY created_at DESC");
    return { status: 200, jsonBody: rows };
  } catch (err: any) {
    console.error("linksGet error:", err);
    return { status: 500, jsonBody: { error: "failed to fetch links", details: String(err) } };
  }
}

app.http("links-get", { methods: ["GET"], authLevel: "anonymous", route: "links", handler: linksGet });
