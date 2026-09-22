import type {
  ContentPart,
  ContentPartDataSource,
  ImagePart,
} from "@tanstack/ai";
import { useCallback, useEffect, useRef, useState } from "react";

export interface PendingFile {
  uid: string;
  name: string;
  size: number;
  type: string;
  file: File;
  thumbnailUrl?: string;
}

function makePendingFile(file: File): PendingFile {
  const isImage = file.type.startsWith("image/");
  return {
    uid: crypto.randomUUID(),
    name: file.name,
    size: file.size,
    type: file.type,
    file,
    ...(isImage && { thumbnailUrl: URL.createObjectURL(file) }),
  };
}

export function usePendingFiles() {
  const [files, setFiles] = useState<PendingFile[]>([]);
  const liveUrlsRef = useRef<Set<string>>(new Set());

  useEffect(
    () => () => {
      for (const url of liveUrlsRef.current) URL.revokeObjectURL(url);
      liveUrlsRef.current.clear();
    },
    [],
  );

  const revoke = (url: string) => {
    URL.revokeObjectURL(url);
    liveUrlsRef.current.delete(url);
  };

  const add = useCallback((incoming: FileList | File[]) => {
    const next = Array.from(incoming).map((f) => makePendingFile(f));
    if (next.length === 0) return;
    for (const pf of next) {
      if (pf.thumbnailUrl) liveUrlsRef.current.add(pf.thumbnailUrl);
    }
    setFiles((prev) => [...prev, ...next]);
  }, []);

  const remove = useCallback((uid: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.uid === uid);
      if (target?.thumbnailUrl) revoke(target.thumbnailUrl);
      return prev.filter((f) => f.uid !== uid);
    });
  }, []);

  const clear = useCallback(() => {
    setFiles((prev) => {
      for (const f of prev) {
        if (f.thumbnailUrl) revoke(f.thumbnailUrl);
      }
      return [];
    });
  }, []);

  return { files, add, remove, clear };
}

function readAsDataSource(file: File): Promise<ContentPartDataSource> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Expected data URL from FileReader"));
        return;
      }
      // Strip the "data:<mime>;base64," prefix — ContentPartDataSource.value
      // stores the bare base64 payload and ContentPartDataSource.mimeType separately.
      const base64 = result.slice(result.indexOf(",") + 1);
      resolve({ type: "data", value: base64, mimeType: file.type });
    });
    reader.addEventListener("error", () =>
      reject(reader.error ?? new Error("File read failed")),
    );
    reader.readAsDataURL(file);
  });
}

async function fileToContentPart(file: File): Promise<ContentPart | null> {
  if (file.type.startsWith("image/")) {
    const source = await readAsDataSource(file);
    return { type: "image", source } satisfies ImagePart;
  }
  return null;
}

export async function pendingFilesToContentParts(
  files: ReadonlyArray<PendingFile>,
): Promise<ContentPart[]> {
  const parts = await Promise.all(
    files.map((pf) => fileToContentPart(pf.file)),
  );
  return parts.filter((p): p is ContentPart => p !== null);
}
