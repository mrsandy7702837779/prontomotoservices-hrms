// src/functions/links-post.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { pool } from "../shared/db";
import { randomUUID } from "crypto";

type Body = { label?: string; url?: string };

export async function linksPost(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    if (!body.label || !body.url) return { status: 400, jsonBody: { error: "label and url required" } };
    await pool.query("INSERT INTO company_links (id,label,url) VALUES ($1,$2,$3)", [randomUUID(), body.label, body.url]);
    return { status: 201, jsonBody: { ok: true } };
  } catch (err: any) {
    console.error("linksPost error:", err);
    return { status: 500, jsonBody: { error: "failed to add link", details: String(err) } };
  }
}

app.http("links-post", { methods: ["POST"], authLevel: "anonymous", route: "links", handler: linksPost });
