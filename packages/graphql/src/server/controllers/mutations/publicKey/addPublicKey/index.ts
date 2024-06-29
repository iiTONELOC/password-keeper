import {GraphQLError} from 'graphql';
import {logger} from 'passwordkeeper.logger';
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
      label,
      defaultKey,
      description,
      publicKey: key,
      userId: userID
    });
  } catch (error) {
    const ErrorMessageString = String(error);
    logger.error(error);

    const validErrors = [
      'Missing required fields',
      'Error: Not Authenticated',
      'Error: Max number of public keys reached',
      'ValidationError: key: Key must be a valid public key in PEM format.'
    ];

    let errorMessage = validErrors.includes(ErrorMessageString)
      ? ErrorMessageString
      : 'addPublicKeyMutation:: An error occurred while adding the public key';

    if (
      ErrorMessageString.includes(
        'E11000 duplicate key error collection: pwd-keeper-test.publickeys'
      )
    ) {
      errorMessage = 'Public key already exists for this user';
    }

    throw new GraphQLError(errorMessage);
  }
};
