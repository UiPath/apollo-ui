import { redirect } from 'next/navigation';
import OverviewPage from './introduction/overview/page.mdx';

// Static Coded App exports cannot serve a redirect, so the root page renders
// the overview inline instead of redirecting to it.
const codedApp = process.env.APOLLO_CODED_APP === '1';

export default function Page() {
  if (!codedApp) {
    redirect('/introduction/overview');
  }
  return <OverviewPage />;
}
