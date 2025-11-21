import { app, HttpRequest, HttpResponseInit } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
const containerName = "payslips"; // existing container

export async function uploadPdf(req: HttpRequest): Promise<HttpResponseInit> {
  try {
    const body = await req.arrayBuffer();
    const fileName = `payslip-${Date.now()}.pdf`;

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    await containerClient.createIfNotExists({ access: "container" });

    const blobClient = containerClient.getBlockBlobClient(fileName);
    await blobClient.uploadData(Buffer.from(body), {
      blobHTTPHeaders: { blobContentType: "application/pdf" },
    });

    return { status: 200, jsonBody: { url: blobClient.url } };
  } catch (err: any) {
    console.error("upload-pdf error:", err);
    return { status: 500, jsonBody: { error: "Upload failed", details: err.message } };
  }
}

app.http("upload-pdf", {
  route: "upload/pdf",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: uploadPdf,
});
