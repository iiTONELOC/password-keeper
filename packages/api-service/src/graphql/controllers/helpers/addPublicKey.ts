import {Types} from 'mongoose';
import {AccountTypeMap, PublicKeyModel, UserModel} from '../../../db/Models';
import type {IUserDocument, ValidAccountTypes} from 'passwordkeeper.types';

/**
 * Adds a new public key to the user's account in accordance with their account type
 *
 * @param userId - MongoDB ObjectId of the user
 * @param publicKey - the public key to add as a string
 * @returns
 */
export const addPublicKey = async (
  userId: Types.ObjectId,
  publicKey: string
): Promise<IUserDocument> => {
  // find the existing user in the database
  const existingUser = await UserModel.findById(userId).select('_id publicKeys accountType');

  if (!existingUser) {
    throw new Error('User not found');
  }

  // determine how many public keys this user has
  const publicKeyCount = existingUser?.publicKeys?.length ?? 0;

  // determine the max number of public keys this user can have according to their type
  const maxPublicKeys = AccountTypeMap[existingUser?.accountType as ValidAccountTypes].maxDevices;

  // if the user has reached the max number of public keys, throw an error
  if (publicKeyCount >= maxPublicKeys) {
    throw new Error('Max number of public keys reached');
  }

  // create a new public key
  const newKey = await PublicKeyModel.create({
    key: publicKey,
    owner: userId
  });

  // update the user's public keys
  const updated = (
    await UserModel.findByIdAndUpdate(userId, {
      $addToSet: {
        publicKeys: newKey._id
      }
    }).select('_id username email')
  )?.toObject() as IUserDocument;

  if (!updated) {
    // remove the newly created public key
    await PublicKeyModel.deleteOne({_id: newKey._id});
    throw new Error('Error updating user');
  }

  return updated;
};
