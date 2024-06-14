import logger from '../logger';
import {Request} from 'express';
import {AuthSessionModel} from '../db/Models';
import {decryptAES} from '../utils/crypto/aes-256';
import {IAuthSessionDocument, PrivateKey} from 'passwordkeeper.types';
import {verifySignature, decryptWithPrivateKey, getPathToPrivateKey, getPrivateKey} from '../utils';

/**
 * Retrieves the authenticated session from the request.
 * Looks for the `Authorization` and `Signature` headers in the request to authenticate the user.
 *
 * The `Authorization` header contains the encrypted session ID
 * The `Signature` header contains the signature of the user id and the session nonce.
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
  const keyIndexHeader: string | string[] | undefined = req.headers['key-index'];

  if (authHeader && signatureHeader) {
    // Get the private key for the app to decrypt the auth header to get the session ID
    const appPrivateKey: PrivateKey | undefined = await getPrivateKey(
      getPathToPrivateKey(),
      process.env.PRIVATE_KEY_PASSPHRASE
    );

    if (!appPrivateKey) {
      return undefined;
    }

    // Decrypt the session ID
    const decryptedID: string | undefined = await decryptWithPrivateKey(appPrivateKey, authHeader);

    // Find the session in the database
    const session: IAuthSessionDocument | undefined = (
      await AuthSessionModel.findOne({_id: decryptedID}).populate({
        path: 'user',
        select: '_id username email publicKeys',
        populate: 'publicKeys'
      })
    )?.toObject();

    if (!session) {
      return undefined;
    }

    // Verify the signature by decrypting the nonce from the database with the app's AES key
    const AES_KEY: string | undefined = process.env.SYMMETRIC_KEY_PASSPHRASE;

    if (!AES_KEY) {
      return undefined;
    }

    // Decrypt the nonce
    const decryptedNonce: string | undefined = await decryptAES(session.nonce, AES_KEY);
    const userPublicKey =
      session.user.publicKeys[keyIndexHeader ? parseInt(keyIndexHeader as string, 10) : 0].key;
    if (!decryptedNonce || !userPublicKey) {
      return undefined;
    }

    // Verify the signature
    const isSignatureValid = await verifySignature(
      session.user._id.toString(),
      decryptedNonce,
      signatureHeader as string,
      userPublicKey
    );

    if (!isSignatureValid) {
      return undefined;
    }

    // If we reach here, the user is authenticated; attach the user information to the context
    logger.warn(
      `getAuth:: Session ${session._id} authenticated for user ${session.user._id}, expires at ${session.expiresAt}`
    );
    return session;
  }

  return undefined;
};
