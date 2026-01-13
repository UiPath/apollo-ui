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
            name: "no-circular",
            severity: "warn",
            comment:
                "Circular dependencies can cause issues and should be avoided",
            from: { path: "^registry/" },
            to: { circular: true },
        },
    ],
    options: {
        includeOnly: "^(registry|lib|hooks)/",
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
