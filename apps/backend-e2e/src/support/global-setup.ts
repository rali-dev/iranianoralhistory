import { config } from 'dotenv';
import { resolve } from 'path';

module.exports = async function () {
  // .env aus dem Workspace-Root laden — enthält DATABASE_URL, JWT_SECRET etc.
  config({ path: resolve(__dirname, '../../../../.env') });
  console.log('\n[backend-e2e] Integration Tests starten...\n');
};
