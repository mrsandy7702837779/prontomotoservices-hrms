import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getContainerClient } from "../shared/storage";

export async function templatesDelete(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const url = new URL(req.url);
    const filename = url.searchParams.get("filename");
    if (!filename) return { status: 400, jsonBody: { error: "filename query required" } };

    const client = getContainerClient();
    const blob = client.getBlockBlobClient(filename);
    await blob.deleteIfExists();

    return { status: 200, jsonBody: { success: true } };
  } catch (err: any) {
    console.error("templates-delete error", err);
    return { status: 500, jsonBody: { error: String(err) } };
  }
}

app.http("templates-delete", {
  route: "templates/delete",
  methods: ["DELETE"],
  authLevel: "anonymous",
  handler: templatesDelete,
});
