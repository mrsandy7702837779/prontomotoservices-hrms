import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getContainerClient, getBlobSasUrl } from "../shared/storage";

export async function templatesList(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const client = getContainerClient();
    const iter = client.listBlobsFlat();
    const items = [];
    for await (const b of iter) {
      const url = await getBlobSasUrl(b.name, 60); // 60 minutes
      items.push({
        name: b.name,
        url,
        size: b.properties.contentLength,
        contentType: b.properties.contentType,
        lastModified: b.properties.lastModified ? b.properties.lastModified.toISOString() : undefined,
      });
    }
    // sort by lastModified desc
    items.sort((a, b) => (b.lastModified || "").localeCompare(a.lastModified || ""));
    return { status: 200, jsonBody: items };
  } catch (err: any) {
    console.error("templates-list error", err);
    return { status: 500, jsonBody: { error: String(err) } };
  }
}

app.http("templates-list", {
  route: "templates/list",
  methods: ["GET"],
  authLevel: "anonymous",
  handler: templatesList,
});
