import {IPublicKeyDocument, IUserDocument} from 'passwordkeeper.types';

/**
 * Retrieves the public key for the user
 *
 * Returns the first public key if no id is provided
 * @param forUser - the populated user document to find the public key for
 * @param usingId - optional id to use when finding the public key
 * @returns
 */
export const findUsersPublicKey = (
  forUser: IUserDocument,
  usingId?: string
): string | undefined => {
  return (
    forUser.publicKeys.find((key: IPublicKeyDocument) => key._id.toString() === usingId)?.key ??
    forUser.publicKeys[0]?.key
  );
};
