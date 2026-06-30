"use client";

export function formatJson(data: unknown): string {
  if (data == null) return "—";
  if (typeof data === "string") return data;
  return JSON.stringify(data, null, 2);
}

export const JsonPanel = ({
  title,
  data,
}: {
  title: string;
  data: unknown;
}) => (
  <div>
    <h4 className="mb-2 text-sm font-semibold">{title}</h4>
    <div className="max-h-[30vh] overflow-auto rounded-md border bg-muted/50 p-3">
      <pre className="whitespace-pre-wrap break-words text-xs">
        {formatJson(data)}
      </pre>
    </div>
  </div>
);
