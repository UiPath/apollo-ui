import type { ImagePart } from "@tanstack/ai";

export function imagePartToUrl(part: ImagePart): string {
  return part.source.type === "data"
    ? `data:${part.source.mimeType};base64,${part.source.value}`
    : part.source.value;
}
