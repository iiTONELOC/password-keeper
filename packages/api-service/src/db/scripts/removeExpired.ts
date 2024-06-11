import {
  AccountCompletionInviteModel,
  AuthSessionModel,
  LoginInviteModel,
  PublicKeyModel
} from '../Models';
import logger from '../../logger';

const now = new Date();
const removedExpiredAccountCompletionInvites = async () => {
  const removed = await AccountCompletionInviteModel.deleteMany({
    expiresAt: {$lt: now}
  });

  removed.deletedCount > 0 &&
    logger.info(`Removed ${removed.deletedCount} expired account completion invites`);
};

const removeExpiredAuthSessions = async () => {
  const removed = await AuthSessionModel.deleteMany({
    expiresAt: {$lt: now}
  });

  removed.deletedCount > 0 && logger.info(`Removed ${removed.deletedCount} expired auth sessions`);
};

const removeExpiredLoginInvites = async () => {
  const removed = await LoginInviteModel.deleteMany({
    expiresAt: {$lt: now}
  });

  removed.deletedCount > 0 && logger.info(`Removed ${removed.deletedCount} expired login invites`);
};

const removeExpiredPublicKeys = async () => {
  const removed = await PublicKeyModel.deleteMany({
    expiresAt: {$lt: now}
  });

  removed.deletedCount > 0 && logger.info(`Removed ${removed.deletedCount} expired public keys`);
};

// run concurrently
export const removeExpired = async () => {
  logger.info('Removing any expired items from the database');
  await Promise.all([
    removedExpiredAccountCompletionInvites(),
    removeExpiredAuthSessions(),
    removeExpiredLoginInvites(),
    removeExpiredPublicKeys()
  ]);
};
