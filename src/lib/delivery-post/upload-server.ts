function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; mime: string } {
  const [header, base64] = dataUrl.split(",");
  const mime = header?.match(/data:([^;]+)/)?.[1] ?? "image/jpeg";
  const binary = Buffer.from(base64 ?? "", "base64");
  return { buffer: binary, mime };
}

function extForMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  return "jpg";
}

export function dataUrlToUploadFile(
  dataUrl: string,
  fileName: string
): File {
  const { buffer, mime } = dataUrlToBuffer(dataUrl);
  const ext = extForMime(mime);
  const name = fileName.includes(".") ? fileName : `${fileName}.${ext}`;
  const blob = new Blob([new Uint8Array(buffer)], { type: mime });
  return new File([blob], name, { type: mime });
}

export function isDataUrl(url: string): boolean {
  return url.startsWith("data:");
}

export function isRemoteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}
