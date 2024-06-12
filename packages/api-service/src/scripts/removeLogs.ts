import path from 'path';
import fs from 'fs/promises';

const removeNonCriticalLogs = async () => {
  // remove logs from the logs directory that are not within production folders
  const logs = await fs.readdir(path.join(process.cwd(), 'logs'));

  for (const log of logs) {
    if (!log.toLowerCase().includes('production')) {
      await fs.rm(path.join(process.cwd(), 'logs', log), {recursive: true});
    }
  }
};

if (require.main === module) {
  removeNonCriticalLogs();
}
