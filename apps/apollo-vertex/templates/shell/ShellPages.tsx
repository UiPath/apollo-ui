import { Link } from "@tanstack/react-router";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground">
          This page is under construction.
        </p>
      </div>
    </div>
  );
}

export function NotFoundPage({ href }: { href: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground">The page does not exist.</p>
        <Link
          to={href}
          className="inline-block text-sm text-primary hover:underline"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}

export function SelectPage() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold">Select a page</h1>
        <p className="text-muted-foreground">
          Choose a page from the sidebar to get started.
        </p>
      </div>
    </div>
  );
}
