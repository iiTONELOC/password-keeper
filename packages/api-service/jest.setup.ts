import connectToDB from './src/db/connection';
import {DBConnection} from 'passwordkeeper.types';
import {
  UserModel,
  PublicKeyModel,
  AuthSessionModel,
  LoginInviteModel,
  AccountCompletionInviteModel
} from './src/db/Models';

export let db: DBConnection | null = null; // NOSONAR - we want it to me mutable

const globalSetup = async () => {
  db = await connectToDB('pwd-keeper-test');

  await Promise.all([
    UserModel.deleteMany(),
    PublicKeyModel.deleteMany(),
    AuthSessionModel.deleteMany(),
    LoginInviteModel.deleteMany(),
    AccountCompletionInviteModel.deleteMany()
  ]);
};

export default globalSetup;
