import {Request} from 'express';
import {AuthSessionModel} from '../../db/Models';
import {decryptAES} from '../../utils/crypto/aes-256';
import {findUsersPublicKey} from '../../graphql/controllers/helpers';
import {AccountStatusTypes, IAuthSessionDocument, PrivateKey} from 'passwordkeeper.types';
import {verifySignature, getAppsPrivateKey, decryptWithPrivateKey, logger} from '../../utils';

/**
 * Retrieves the authenticated session from the request.
 * Looks for the `Authorization` and `Signature` headers in the request to authenticate the user.
 *
 * The `Authorization` header contains the encrypted session ID
 * The `Signature` header contains the signature of the user id and the session nonce.
 * The `Key-Id` header is an optional header that specifies the public key to use for signature verification rather than the default key.
 *
 * @param req Express request object
 * @returns  The authenticated session or `undefined` if the user is not authenticated.
 */
export const getAuth = async (req: Request): Promise<IAuthSessionDocument | undefined> => {
  // Look for the auth header which holds the encrypted session ID
  const authHeader: string | undefined = req.headers.authorization;
  // Look for the signature header
  const signatureHeader: string | string[] | undefined = req.headers.signature;
  // Look for an optional Key Index header, which is used to specify the public key to use for signature verification
  const publicKeyId: string | string[] | undefined = req.headers['key-id'];

  // need both headers to authenticate
  if (authHeader && signatureHeader) {
    // Get the private key for the app to decrypt the auth header to get the session ID
    const appPrivateKey: PrivateKey | undefined = await getAppsPrivateKey();
    /* istanbul ignore next */
    if (!appPrivateKey) {
      /* istanbul ignore next */
      return undefined;
    }

    // Decrypt the session ID
    const decryptedID: string | undefined = await decryptWithPrivateKey(appPrivateKey, authHeader);

    // Find the session in the database
    const session: IAuthSessionDocument | undefined = (
      await AuthSessionModel.findOne({_id: decryptedID}).populate({
        path: 'user',
        select: '_id username email publicKeys account passwords',
        populate: [
          {path: 'passwords'},
          {path: 'publicKeys'},
          {
            path: 'account',
            select: 'status accountType',
            populate: [{path: 'accountType'}]
          }
        ]
      })
    )?.toObject();

    const invalidAccountStatusTypesForLogin: AccountStatusTypes[] = [
      AccountStatusTypes.SUSPENDED,
      AccountStatusTypes.DELINQUENT,
      AccountStatusTypes.CANCELLED,
      AccountStatusTypes.PENDING
    ];

    // if the session is not found or the account status is invalid, return undefined
    if (!session || invalidAccountStatusTypesForLogin.includes(session.user.account.status)) {
      return undefined;
    }

    // Verify the signature by decrypting the nonce from the database with the app's AES key
    const AES_KEY: string | undefined = process.env.SYMMETRIC_KEY_PASSPHRASE;
    /* istanbul ignore next */
    if (!AES_KEY) {
      /* istanbul ignore next */
      return undefined;
    }

    // Decrypt the nonce
    const decryptedNonce: string | undefined = await decryptAES(session.nonce, AES_KEY);

    const userPublicKey: string | undefined = findUsersPublicKey(
      session.user,
      publicKeyId as string | undefined
    );

    /* istanbul ignore next */
    if (!decryptedNonce || !userPublicKey) {
      /* istanbul ignore next */
      return undefined;
    }

    // Verify the signature
    const isSignatureValid = await verifySignature(
      session.user._id.toString(),
      decryptedNonce,
      signatureHeader as string,
      userPublicKey
    );

    /* istanbul ignore next */
    if (!isSignatureValid) {
      /* istanbul ignore next */
      return undefined;
    }

    // ensure the session has not expired
    if (session.expiresAt < new Date()) {
      logger.warn(
        `getAuth:: Session ${session._id} expired for user ${session.user._id}, expires at ${session.expiresAt}`
      );
      return undefined;
    }

    // If we reach here, the user is authenticated; attach the user information to the context
    logger.warn(
      `getAuth:: Session ${session._id} authenticated for user ${session.user._id}, expires at ${session.expiresAt}`
    );
    return session;
  }
  // headers not found , return undefined
  return undefined;
};
