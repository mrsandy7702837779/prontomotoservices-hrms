// templates-upload.ts
import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { getContainerClient } from "../shared/storage"; // adjust path/name if different

type UploadBody = {
  filename?: string;
  base64?: string;
  contentType?: string;
};

export async function templatesUpload(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    // parse JSON body and cast to our shape
    const body = (await req.json()) as UploadBody;

    const filename = body?.filename?.trim();
    const base64 = body?.base64;
    const contentType = body?.contentType || "application/octet-stream";

    if (!filename) {
      return { status: 400, jsonBody: { error: "filename is required" } };
    }
    if (!base64) {
      return { status: 400, jsonBody: { error: "base64 content is required" } };
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64, "base64");

    // Optional: reject very large files (example: > 20MB)
    const MAX_BYTES = 20 * 1024 * 1024;
    if (buffer.length > MAX_BYTES) {
      return { status: 413, jsonBody: { error: "File too large" } };
    }

    // Upload to blob container
    const client = getContainerClient(); // ensure this returns the right container client
    const blobClient = client.getBlockBlobClient(filename);

    await blobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: contentType },
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        name: filename,
        url: blobClient.url,
        size: buffer.length,
      },
    };
  } catch (err: any) {
    console.error("templates-upload error:", err);
    return { status: 500, jsonBody: { error: "upload failed", details: String(err) } };
  }
}

app.http("templates-upload", {
  route: "templates/upload",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: templatesUpload,
});
