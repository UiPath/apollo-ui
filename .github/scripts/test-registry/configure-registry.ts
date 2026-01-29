import { readFileSync, writeFileSync } from 'node:fs';

interface ComponentsConfig {
  registries?: Record<
    string,
    {
      url: string;
      params?: Record<string, string>;
    }
  >;
  [key: string]: unknown;
}

function main() {
  const registryUrl = process.env.REGISTRY_URL;
  const configPath = './components.json';

  if (!registryUrl) {
    console.error('REGISTRY_URL environment variable is required');
    process.exit(1);
  }

  let componentsConfigString: string;

  try {
    componentsConfigString = readFileSync(configPath, 'utf-8');
  } catch (error) {
    console.error(`Failed to read components.json: ${error}`);
    process.exit(1);
  }

  let componentsConfig: ComponentsConfig;

  try {
    componentsConfig = JSON.parse(componentsConfigString);
  } catch (error) {
    console.error(`Failed to parse components.json: ${error}`);
    process.exit(1);
  }

  componentsConfig.registries = componentsConfig.registries ?? {};
  componentsConfig.registries['@uipath'] = {
    url: `${registryUrl}/r/{name}.json`,
  };

  try {
    writeFileSync(configPath, JSON.stringify(componentsConfig, null, 2));
  } catch (error) {
    console.error(`Failed to write components.json: ${error}`);
    process.exit(1);
  }

  console.log(`Configured @uipath registry with URL: ${registryUrl}/r/{name}.json`);
}

main();
