import {logger} from 'passwordkeeper.logger';
import {DBConnection} from 'passwordkeeper.types';
import {
  connectToDB,
  PublicKeyModel,
  AuthSessionModel,
  LoginInviteModel,
  disconnectFromDB
} from 'passwordkeeper.database';

const removeExpiredAuthSessions = async () => {
  const now = new Date();
  const removed = await AuthSessionModel.deleteMany({
    expiresAt: {$lt: now}
  });

  removed.deletedCount > 0 && logger.info(`Removed ${removed.deletedCount} expired auth sessions`);
};

const removeExpiredLoginInvites = async () => {
  const now = new Date();
  const removed = await LoginInviteModel.deleteMany({
    expiresAt: {$lt: now}
  });

  removed.deletedCount > 0 && logger.info(`Removed ${removed.deletedCount} expired login invites`);
};

const removeExpiredPublicKeys = async () => {
  const now = new Date();
  const removed = await PublicKeyModel.deleteMany({
    expiresAt: {$lt: now}
  });

  removed.deletedCount > 0 && logger.info(`Removed ${removed.deletedCount} expired public keys`);
};

// run concurrently
export const removeExpired = async () => {
  logger.info('Removing any expired items from the database');
  const db: DBConnection = await connectToDB();
  await Promise.all([
    removeExpiredAuthSessions(),
    removeExpiredLoginInvites(),
    removeExpiredPublicKeys()
  ]);

  db && (await disconnectFromDB(db));
};

// run as a script
if (require.main === module) {
  // check for command line arguments.
  // if there are not any, run and exit
  // if there are, run and keep the process running on an interval using the provided time

  const interval = process.argv[2];

  if (!interval) {
    removeExpired().then(() => process.exit(0));
  } else {
    removeExpired().catch(err => logger.error(err));
    const intervalInMs = parseInt(interval);
    const intervalInHHMMSS = new Date(intervalInMs).toISOString().substring(11, 19);
    logger.info(
      `Removing expired items from the database interval of ${intervalInHHMMSS} (HH:MM:SS)`
    );
    setInterval(async () => {
      removeExpired().catch(err => logger.error(err));
    }, parseInt(interval));
  }
}
