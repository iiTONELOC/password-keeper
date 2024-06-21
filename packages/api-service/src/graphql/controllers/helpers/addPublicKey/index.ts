import {AccountModel, AccountTypeMap, PublicKeyModel, UserModel} from '../../../../db/Models';
import type {IUserDocument, AddPublicKeyProps, AddPublicKeyReturns} from 'passwordkeeper.types';

/**
 * Adds a new public key to the user's account in accordance with their account type
 *
 * @param userId - MongoDB ObjectId of the user
 * @param publicKey - the public key to add as a string
 * @returns
 */
export const addPublicKey = async (props: AddPublicKeyProps): Promise<AddPublicKeyReturns> => {
  const {userId, publicKey, label, description, expiresAt, defaultKey} = props;

  // find the existing user in the database
  const existingUser: IUserDocument | null = (
    await UserModel.findById(userId)
      .select('_id username email publicKeys account')
      .populate({path: 'publicKeys'})
      .populate({
        path: 'account',
        select: 'accountType publicKeys',
        populate: {path: 'accountType'}
      })
  )?.toObject() as IUserDocument | null;

  if (!existingUser) {
    throw new Error('User not found');
  }

  // determine how many public keys the account has
  /* istanbul ignore next */
  const publicKeyCount = existingUser?.account.publicKeys?.length ?? 0;

  // determine the max number of public keys this user can have according to their account type
  /* istanbul ignore next */
  const maxPublicKeys = AccountTypeMap[existingUser.account.accountType.type].maxPublicKeys;

  // if the user has reached the max number of public keys, throw an error
  if (publicKeyCount >= maxPublicKeys) {
    throw new Error('Max number of public keys reached');
  }

  // if this is the user's first public key, make it the default key
  const setDefault = publicKeyCount === 0;

  // create a new public key
  const newKey = await PublicKeyModel.create({
    label,
    expiresAt,
    description,
    key: publicKey,
    owner: userId,
    default: defaultKey ?? setDefault ?? false
  });

  // add the key to the user's account
  await AccountModel.findOneAndUpdate({owner: userId}, {$addToSet: {publicKeys: newKey._id}});

  /* istanbul ignore next */
  // update the user's public keys
  const updated = (
    await UserModel.findByIdAndUpdate(
      userId,
      {
        $addToSet: {
          publicKeys: newKey._id
        }
      },
      {new: true, runValidators: true}
    )
      .select('_id username email publicKeys account')
      .populate({path: 'publicKeys'})
      .populate({path: 'account', select: 'accountType', populate: {path: 'accountType'}})
  )?.toObject() as IUserDocument;

  /* istanbul ignore next */
  if (!updated) {
    // remove the newly created public key
    /* istanbul ignore next */
    await PublicKeyModel.deleteOne({_id: newKey._id});
    /* istanbul ignore next */
    await AccountModel.findOneAndUpdate({owner: userId}, {$pull: {publicKeys: newKey._id}});
    /* istanbul ignore next */
    throw new Error('Error updating user');
  }

  return {user: updated, addedKeyId: newKey._id};
};
