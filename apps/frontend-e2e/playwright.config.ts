import { defineConfig, devices } from '@playwright/test';
import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';

const baseURL = process.env['BASE_URL'] || 'http://localhost:4200';

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  timeout: 60000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    navigationTimeout: 60000,
    actionTimeout: 15000,
    launchOptions: {
      args: ['--no-proxy-server'],
    },
  },
  webServer: {
    command: 'npx nx run frontend:serve',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120000,
    cwd: workspaceRoot,
  },
  workers: 2,
  retries: 1,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
});
