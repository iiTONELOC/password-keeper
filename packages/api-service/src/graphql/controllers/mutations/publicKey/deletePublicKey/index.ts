import {GraphQLError} from 'graphql';
import {logger} from '../../../../../utils';
import {enforceUserSession} from '../../../helpers';
import {PublicKeyModel} from 'passwordkeeper.database';
import {PUBLIC_KEY_ERROR_MESSAGES as ERROR_MESSAGES} from '../../../../errors/messages';
import {
  type AuthContext,
  type IPublicKeyDocument,
  type IAuthSessionDocument,
  type DeletePublicKeyMutationPayload,
  type DeletePublicKeyMutationVariables
} from 'passwordkeeper.types';

export const deletePublicKey = async (
  _: undefined,
  args: DeletePublicKeyMutationVariables,
  context: AuthContext
): Promise<DeletePublicKeyMutationPayload> => {
  try {
    // ensure the session hasn't expired
    const session: IAuthSessionDocument = enforceUserSession(context);
    // get the current user's ID from the session
    const userID = session.user._id;

    const {id} = args?.deletePublicKeyArgs ?? {};

    if (!id) {
      throw new GraphQLError(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
    }

    // look up the key and make sure it is not the default key
    const publicKey: IPublicKeyDocument | null = await PublicKeyModel.findOne({
      _id: id,
      owner: userID
    });

    if (!publicKey) {
      throw new GraphQLError(ERROR_MESSAGES.NOT_FOUND);
    }

    if (publicKey.default) {
      throw new GraphQLError(ERROR_MESSAGES.CANNOT_DELETE_DEFAULT_KEY);
    }

    // check that this is not the last key, even if its not the default key
    const numberOfUserKeys = await PublicKeyModel.countDocuments({
      owner: userID
    });

    if (numberOfUserKeys <= 1 && !publicKey.default) {
      throw new GraphQLError(ERROR_MESSAGES.LAST_KEY);
    }

    const deletedPublicKey: IPublicKeyDocument | null = (
      await PublicKeyModel.findOneAndDelete({
        _id: id,
        owner: userID
      })
    )?.toObject() as IPublicKeyDocument | null;

    if (!deletedPublicKey) {
      throw new GraphQLError(ERROR_MESSAGES.ERROR_DELETING_PUBLIC_KEY);
    }

    return {...deletedPublicKey} as DeletePublicKeyMutationPayload;
  } catch (error) {
    logger.error(error);
    const okMessages: string[] = [...Object.values(ERROR_MESSAGES)];

    const currentMsg = String(error);

    // if the error message is in our error messages object, throw that error message
    if (okMessages.includes(currentMsg)) {
      throw new GraphQLError(currentMsg);
    } else {
      throw new GraphQLError(ERROR_MESSAGES.ERROR_DELETING_PUBLIC_KEY);
    }
  }
};
