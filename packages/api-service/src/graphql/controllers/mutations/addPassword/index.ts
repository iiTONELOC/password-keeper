import {GraphQLError} from 'graphql';
import {logger} from '../../../../utils';
import {enforceUserSession} from '../../helpers';
import {encryptAES} from '../../../../utils/crypto/aes-256';
import {AccountTypeMap, EncryptedUserPasswordModel, UserModel} from '../../../../db/Models';
import {
  AuthContext,
  IUserDocument,
  IPasswordEncrypted,
  IAuthSessionDocument,
  IPasswordEncryptedAtRest,
  AddPasswordMutationVariables
} from 'passwordkeeper.types';

export const addPassword = async (
  _: undefined,
  args: AddPasswordMutationVariables,
  context: AuthContext
): Promise<IPasswordEncrypted> => {
  const session: IAuthSessionDocument = enforceUserSession(context);
  const userID = session.user._id;

  /* istanbul ignore next */
  const {url, name, username, password} = args.addPasswordArgs ?? {};

  // if name, username, or password is missing, throw an error
  if (!name || !username || !password) {
    throw new GraphQLError('Missing required fields');
  }

  // ensure the user can add a password due to their account type

  /* istanbul ignore */
  const userDataFromDB: IUserDocument | null = (
    await UserModel.findById(userID)
      .select('passwords account role')
      .populate({path: 'account', select: 'accountType', populate: {path: 'accountType'}})
  )?.toObject() as IUserDocument | null;

  /* istanbul ignore next */
  if (!userDataFromDB) {
    /* istanbul ignore next */
    throw new GraphQLError('Not Authenticated');
  }

  const currentNumberOfPasswords: number = userDataFromDB?.passwords?.length;
  const maxNumberOfPasswords: number =
    AccountTypeMap[userDataFromDB.account.accountType.type].maxPasswords;

  if (currentNumberOfPasswords >= maxNumberOfPasswords) {
    throw new GraphQLError('Max number of passwords reached');
  }

  try {
    // encrypt the data for storage at rest
    const [encryptedName, encryptedUsername, encryptedPassword, encryptedURL] = await Promise.all([
      encryptAES(JSON.stringify(name), process.env.SYMMETRIC_KEY_PASSPHRASE as string),
      encryptAES(JSON.stringify(username), process.env.SYMMETRIC_KEY_PASSPHRASE as string),
      encryptAES(JSON.stringify(password), process.env.SYMMETRIC_KEY_PASSPHRASE as string),
      /* istanbul ignore next */
      url
        ? /* istanbul ignore next */
          encryptAES(JSON.stringify(url), process.env.SYMMETRIC_KEY_PASSPHRASE as string)
        : /* istanbul ignore next */
          Promise.resolve(undefined)
    ]);

    const creationData: IPasswordEncryptedAtRest = {
      name: {
        encryptedData: encryptedName,
        iv: encryptedName.iv
      },
      username: {
        encryptedData: encryptedUsername,
        iv: encryptedUsername.iv
      },
      password: {
        encryptedData: encryptedPassword,
        iv: encryptedPassword.iv
      },
      url: encryptedURL
        ? /* istanbul ignore next */
          {
            encryptedData: encryptedURL,
            iv: encryptedURL.iv
          }
        : /* istanbul ignore next */
          undefined,
      owner: userID
    };

    // create the password object in the database
    const newEncryptedAtRestUserPassword = await EncryptedUserPasswordModel.create(creationData);

    // add the password to the user's password list
    await UserModel.findByIdAndUpdate(
      {_id: userID},
      {$addToSet: {passwords: newEncryptedAtRestUserPassword._id}}
    );

    return {
      url,
      name,
      username,
      password,
      owner: userID,
      _id: newEncryptedAtRestUserPassword._id,
      expiresAt: newEncryptedAtRestUserPassword.expiresAt
    };

    /* istanbul ignore next */
  } catch (error) {
    /* istanbul ignore next */
    logger.error('addPassword:: error -', error);
    /* istanbul ignore next */
    throw new GraphQLError('Error adding password');
  }
};
