/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "registry-isolation",
      comment:
        "Registry components should not import from outside the registry folder. " +
        "Exceptions: external dependencies and @/lib/*",
      severity: "error",
      from: { path: "^registry/" },
      to: {
        pathNot: ["^registry/", "^lib/"],
      },
    },
    {
      name: "examples-not-shipped",
      comment:
        "Example adapters (examples/) belong to solutions and aren't shipped. " +
        "Nothing outside an examples/ folder may import one.",
      severity: "error",
      from: { path: "^registry/", pathNot: "/examples/" },
      to: { path: "/examples/" },
    },
    {
      name: "occupants-template-agnostic",
      comment:
        "Occupants describe surfaces, never a template, so occupant code can't " +
        "import from templates/ or app/.",
      severity: "error",
      from: { path: "^registry/" },
      to: { path: "^(templates|app)/" },
    },
    {
      name: "no-circular",
      severity: "warn",
      comment: "Circular dependencies can cause issues and should be avoided",
      from: { path: "^registry/" },
      to: { circular: true },
    },
  ],
  options: {
    // templates/ and app/ are included so the rules above can see imports
    // into them.
    includeOnly: "^(registry|lib|hooks|templates|app)/",
    doNotFollow: {
      path: "node_modules",
      dependencyTypes: [
        "npm",
        "npm-dev",
        "npm-optional",
        "npm-peer",
        "npm-bundled",
        "npm-no-pkg",
      ],
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: "tsconfig.json",
    },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "node_modules/[^/]+",
      },
    },
  },
};
