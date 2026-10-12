import { redirect } from "next/navigation";
import { DocsPageView } from "../_components/docs-page-view";

// Static Coded App exports cannot serve a redirect, so this index renders the
// overview inline instead of redirecting to it.
const codedApp = process.env.APOLLO_CODED_APP === "1";

export default function ComponentsIndex() {
  if (!codedApp) {
    redirect("/components/overview");
  }
  return <DocsPageView slug={["components", "overview"]} />;
}
