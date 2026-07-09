import nextra from 'nextra';

const withNextra = nextra({
  defaultShowCopyCode: true,
});

// Coded App preview builds (uip-go) need a static export served from a
// sub-path of the Coded App host. Regular dev/prod builds are unaffected.
const codedApp = process.env.APOLLO_CODED_APP === '1';
const codedAppPath = process.env.APOLLO_CODED_APP_PATH?.replace(/^\/+|\/+$/g, '');

export default withNextra({
  ...(codedApp && {
    output: 'export',
    trailingSlash: true,
    ...(codedAppPath && { basePath: `/${codedAppPath}` }),
  }),
  reactCompiler: true,
  turbopack: {
    resolveAlias: {
      'next-mdx-import-source-file': './mdx-components.tsx',
    },
  },
});
