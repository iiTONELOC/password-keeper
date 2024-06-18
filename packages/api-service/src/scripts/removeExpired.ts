import {logger} from '../utils';
import connectToDatabase, {disconnectFromDB} from '../db/connection';
import {DBConnection, IAccountCompletionInviteDocument} from 'passwordkeeper.types';
import {
  UserModel,
  PublicKeyModel,
  AuthSessionModel,
  LoginInviteModel,
  AccountCompletionInviteModel
} from '../db/Models';

const removedExpiredAccountCompletionInvites = async () => {
  const now = new Date();
  // find all account completion invites that have expired, so we can get
  // a list of users that have not completed their account setup and remove
  // them
  const expiredAccountCompletionInvites: IAccountCompletionInviteDocument[] =
    (await AccountCompletionInviteModel.find({
      expiresAt: {$lt: now}
    })) ?? [];

  const userIds = expiredAccountCompletionInvites.map(invite => invite.user);

  // if there are any userIds, remove them
  if (userIds.length > 0) {
    const removed = await UserModel.deleteMany({_id: {$in: userIds}});
    removed.deletedCount > 0 &&
      logger.info(`Removed ${removed.deletedCount} users who did not complete their account setup`);
  }

  const removed = await AccountCompletionInviteModel.deleteMany({
    expiresAt: {$lt: now}
  });

  removed.deletedCount > 0 &&
    logger.info(`Removed ${removed.deletedCount} expired account completion invites`);
};

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
  const db: DBConnection = await connectToDatabase();
  await Promise.all([
    removedExpiredAccountCompletionInvites(),
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

    logger.info(`Running removeExpired script on an interval of ${interval}ms`);
    setInterval(async () => {
      removeExpired().catch(err => logger.error(err));
    }, parseInt(interval));
  }
}
