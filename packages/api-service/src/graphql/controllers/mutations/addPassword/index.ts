import {GraphQLError} from 'graphql';
import {logger} from '../../../../utils';
import {enforceUserSession} from '../../helpers';
import {encryptAES} from '../../../../utils/crypto/aes-256';
import {UserModel, AccountTypeModel, EncryptedUserPasswordModel} from '../../../../db/Models';
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

  const user: IUserDocument | null = (
    await UserModel.findById(userID)
      .select('_id username email publicKeys account passwords')
      .populate({path: 'publicKeys'})
      .populate({
        path: 'account',
        select: 'accountType publicKeys',
        populate: {path: 'accountType'}
      })
  )?.toObject() as IUserDocument | null;

  if (!user) {
    throw new GraphQLError('Unauthorized');
  }

  const currentNumberOfPasswords: number = user?.passwords?.length;
  const maxNumberOfPasswords: number =
    (await AccountTypeModel.findOne({type: user.account.accountType.type}))?.toObject()
      .maxPasswords ?? 0;

  if (currentNumberOfPasswords < maxNumberOfPasswords) {
    try {
      // encrypt the data for storage at rest
      const [encryptedName, encryptedUsername, encryptedPassword, encryptedURL] = await Promise.all(
        [
          encryptAES(JSON.stringify(name), process.env.SYMMETRIC_KEY_PASSPHRASE as string),
          encryptAES(JSON.stringify(username), process.env.SYMMETRIC_KEY_PASSPHRASE as string),
          encryptAES(JSON.stringify(password), process.env.SYMMETRIC_KEY_PASSPHRASE as string),
          /* istanbul ignore next */
          url
            ? /* istanbul ignore next */
              encryptAES(JSON.stringify(url), process.env.SYMMETRIC_KEY_PASSPHRASE as string)
            : /* istanbul ignore next */
              Promise.resolve(undefined)
        ]
      );

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
  } else {
    throw new GraphQLError('Max number of passwords reached');
  }
};
