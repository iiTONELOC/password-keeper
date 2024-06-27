import {db} from './jest.setup';
import {disconnectFromDB} from './src/connection';
import {
  UserModel,
  AccountModel,
  PublicKeyModel,
  AuthSessionModel,
  LoginInviteModel,
  EncryptedUserPasswordModel,
  AccountCompletionInviteModel
} from './src/Models';

const globalTeardown = async () => {
  await Promise.all([
    UserModel.deleteMany(),
    AccountModel.deleteMany(),
    PublicKeyModel.deleteMany(),
    AuthSessionModel.deleteMany(),
    LoginInviteModel.deleteMany(),
    EncryptedUserPasswordModel.deleteMany(),
    AccountCompletionInviteModel.deleteMany()
  ]);

  db && (await disconnectFromDB(db));
};

export default globalTeardown;
