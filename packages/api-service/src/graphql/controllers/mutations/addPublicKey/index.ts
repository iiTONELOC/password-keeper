import {GraphQLError} from 'graphql';
import {logger} from '../../../../utils';
import {addPublicKey, enforceUserSession} from '../../helpers';
import {
  AuthContext,
  AddPublicKeyProps,
  IAuthSessionDocument,
  AddPublicKeyMutationPayload,
  AddPublicKeyMutationVariables
} from 'passwordkeeper.types';

export const addPublicKeyMutation = async (
  _: undefined,
  args: AddPublicKeyMutationVariables,
  context: AuthContext
): Promise<AddPublicKeyMutationPayload> => {
  try {
    // ensure the session hasn't expired
    const session: IAuthSessionDocument = enforceUserSession(context);
    // get the current user's ID from the session
    const userID = session.user._id;

    const {publicKey, userId, label, defaultKey, description}: AddPublicKeyProps =
      args.addPublicKeyArgs ?? {};

    if (!publicKey) {
      throw new GraphQLError('Missing required fields');
    }

    // ensure the user is adding the key to their own account
    if (userId?.toString() !== userID?.toString()) {
      throw new GraphQLError('Unauthorized');
    }

    return await addPublicKey({
      publicKey,
      userId,
      label,
      defaultKey,
      description
    });
  } catch (error) {
    logger.error(error);
    throw new GraphQLError('Error adding public key');
  }
};
