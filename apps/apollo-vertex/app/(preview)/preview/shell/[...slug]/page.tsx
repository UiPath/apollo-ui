import Link from "next/link";

export default function ShellCatchAllPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">The page does not exist.</p>
        <Link
          href="/preview/shell/dashboard"
          className="inline-block text-sm text-primary hover:underline"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
