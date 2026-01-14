import { execSync } from 'child_process';
import type { RsbuildPlugin } from '@rsbuild/core';

export const pluginYalcPush = (packageName: string): RsbuildPlugin => ({
  name: 'plugin-yalc-push',
  setup(api) {
    let isFirstBuild = true;
    let lastCheck = 0;
    let cachedHasInstallations = false;
    const CHECK_INTERVAL = 5000; // 5 seconds

    api.onAfterBuild(async () => {
      try {
        // Check if there are any yalc installations (cached for 5 seconds)
        let hasInstallations = cachedHasInstallations;

        if (Date.now() - lastCheck > CHECK_INTERVAL) {
          try {
            const output = execSync('yalc installations show', {
              encoding: 'utf8',
              stdio: 'pipe',
            });
            hasInstallations = output.includes(packageName);
            cachedHasInstallations = hasInstallations;
            lastCheck = Date.now();
          } catch {
            // Command failed - no yalc installations found
            hasInstallations = false;
            cachedHasInstallations = false;
            lastCheck = Date.now();
          }
        }

        if (!hasInstallations) {
          if (isFirstBuild) {
            console.log('\n💡 No yalc installations found.');
            console.log(`   To link this package in your consuming project, run:`);
            console.log(`   cd /path/to/your/project`);
            console.log(`   yalc add ${packageName}`);
            isFirstBuild = false;
          }
          return;
        }

        // Run yalc push
        console.log('\n🔄 Build complete, pushing to yalc...');
        isFirstBuild = false;

        execSync('yalc push --changed', {
          stdio: 'inherit',
        });

        console.log('✅ Pushed to linked projects\n');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Failed to push to yalc:', errorMessage);
      }
    });
  },
});
