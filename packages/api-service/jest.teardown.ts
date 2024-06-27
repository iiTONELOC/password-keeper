import {db} from './jest.setup';
import {
  UserModel,
  AccountModel,
  PublicKeyModel,
  AuthSessionModel,
  LoginInviteModel,
  disconnectFromDB,
  EncryptedUserPasswordModel,
  AccountCompletionInviteModel
} from 'passwordkeeper.database';

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
