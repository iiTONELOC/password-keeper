import {GraphQLError} from 'graphql';
import {logger} from '../../../../../utils';
import {addPublicKey, enforceUserSession} from '../../../helpers';
import {
  AuthContext,
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

    const {key, label, defaultKey, description} = args.addPublicKeyArgs ?? {};

    if (!key) {
      throw new GraphQLError('Missing required fields');
    }

    return await addPublicKey({
      publicKey: key,
      userId: userID,
      label,
      defaultKey,
      description
    });
  } catch (error) {
    logger.error(error);
    throw new GraphQLError('Error adding public key');
  }
};
