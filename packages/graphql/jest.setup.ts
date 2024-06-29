import {DBConnection} from 'passwordkeeper.types';
import {seedAccountTypes} from './src/scripts/seedDatabase';
import {
  UserModel,
  connectToDB,
  AccountModel,
  PublicKeyModel,
  AuthSessionModel,
  LoginInviteModel,
  EncryptedUserPasswordModel,
  AccountCompletionInviteModel
} from 'passwordkeeper.database';
import {ensureRsaKeysExist} from './src/server';

export let db: DBConnection | null = null; // NOSONAR - we want it to me mutable

const globalSetup = async () => {
  db = await connectToDB('pwd-keeper-test');

  await Promise.all([
    seedAccountTypes(),
    ensureRsaKeysExist(),
    UserModel.deleteMany(),
    AccountModel.deleteMany(),
    PublicKeyModel.deleteMany(),
    AuthSessionModel.deleteMany(),
    LoginInviteModel.deleteMany(),
    EncryptedUserPasswordModel.deleteMany(),
    AccountCompletionInviteModel.deleteMany()
  ]);
};

export default globalSetup;
