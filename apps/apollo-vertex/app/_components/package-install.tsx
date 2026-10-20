import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import { Tab, Tabs } from "fumadocs-ui/components/tabs";

const PACKAGE_MANAGERS = [
  { name: "npm", command: "npm install" },
  { name: "pnpm", command: "pnpm add" },
  { name: "bun", command: "bun add" },
];

/**
 * Install command with a tab per package manager. The selected tab is saved
 * in localStorage and shared by every `PackageInstall` on the site.
 */
export function PackageInstall({ packages }: { packages: string }) {
  return (
    <Tabs
      groupId="package-manager"
      persist
      items={PACKAGE_MANAGERS.map(({ name }) => name)}
    >
      {PACKAGE_MANAGERS.map(({ name, command }) => (
        <Tab key={name} value={name}>
          <ServerCodeBlock lang="bash" code={`${command} ${packages}`} />
        </Tab>
      ))}
    </Tabs>
  );
}
