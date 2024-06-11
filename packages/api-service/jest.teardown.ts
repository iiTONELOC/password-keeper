import {db} from './jest.setup';
import {disconnectFromDB} from './src/db/connection';
import {
  UserModel,
  PublicKeyModel,
  AuthSessionModel,
  AccountCompletionInviteModel
} from './src/db/Models';

const globalTeardown = async () => {
  await Promise.all([
    UserModel.deleteMany(),
    PublicKeyModel.deleteMany(),
    AuthSessionModel.deleteMany(),
    AccountCompletionInviteModel.deleteMany()
  ]);

  db && (await disconnectFromDB(db));
};

export default globalTeardown;
