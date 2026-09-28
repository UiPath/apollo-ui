/**
 * Prints the public URL of a Coded App deployed to uipath.host, derived from
 * the tenant env (used when uip-go's output didn't include an "App URL:"
 * line, and for the stable main apps that this run didn't deploy).
 *
 * Inputs (env): UIPATH_BASE_URL, UIPATH_ORG_NAME, APP_NAME.
 * Output: the URL on stdout, e.g. https://org.env.uipath.host/app-name
 */
const baseUrl = process.env.UIPATH_BASE_URL || '';
const orgName = process.env.UIPATH_ORG_NAME || '';
const appName = process.env.APP_NAME || '';

// staging.uipath.com → "staging" env infix; cloud/api hosts → none.
let environment = '';
try {
  const hostname = new URL(baseUrl).hostname;
  let inferred = hostname.replace(/\.uipath\.com$/, '');
  inferred = inferred.replace(/^api\./, '').replace(/\.api$/, '');
  environment = inferred && inferred !== 'api' && inferred !== 'cloud' ? inferred : '';
} catch {
  environment = '';
}

const suffix = environment ? `.${environment}` : '';
console.log(`https://${orgName}${suffix}.uipath.host/${appName}`);
