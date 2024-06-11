import {db} from './jest.setup';
import {disconnectFromDB} from './src/db/connection';
import {
  UserModel,
  PublicKeyModel,
  AuthSessionModel,
  LoginInviteModel,
  AccountCompletionInviteModel
} from './src/db/Models';

const globalTeardown = async () => {
  await Promise.all([
    UserModel.deleteMany(),
    PublicKeyModel.deleteMany(),
    AuthSessionModel.deleteMany(),
    LoginInviteModel.deleteMany(),
    AccountCompletionInviteModel.deleteMany()
  ]);

  db && (await disconnectFromDB(db));
};

export default globalTeardown;
