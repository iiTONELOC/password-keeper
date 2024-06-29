import {generateRSAKeysForUser} from './complete-account';

if (require.main === module) {
  if (process.env.NODE_ENV === 'production') {
    console.error('This script should not be run in production');
    process.exit(1);
  }

  const username = process.argv[2];
  const increment = process.argv[3] ? parseInt(process.argv[3], 10) : undefined;

  if (!username) {
    console.error('Please provide a username');
    process.exit(1);
  }

  generateRSAKeysForUser(username, increment).catch(err => {
    console.error(err);
    process.exit(1);
  });
}
