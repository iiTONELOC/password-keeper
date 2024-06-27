import {GraphQLError} from 'graphql';
import {logger} from '../../../../../utils';
import {enforceUserSession} from '../../../helpers';
import {PublicKeyModel} from 'passwordkeeper.database';
import {PUBLIC_KEY_ERROR_MESSAGES as ERROR_MESSAGES} from '../../../../errors/messages';
import {
  type AuthContext,
  type IAuthSessionDocument,
  type UpdatePublicKeyMutationPayload,
  type UpdatePublicKeyMutationVariables
} from 'passwordkeeper.types';

export const updatePublicKey = async (
  _: undefined,
  args: UpdatePublicKeyMutationVariables,
  context: AuthContext
): Promise<UpdatePublicKeyMutationPayload> => {
  try {
    // ensure the session hasn't expired
    const session: IAuthSessionDocument = enforceUserSession(context);
    // get the current user's ID from the session
    const userID = session.user._id;

    const {key, label, defaultKey, description, id, expiresAt} = args.updatePublicKeyArgs ?? {};

    if (!id) {
      throw new GraphQLError(ERROR_MESSAGES.MISSING_REQUIRED_FIELDS);
    }

    if (!key && !label && defaultKey === undefined && !description && !expiresAt) {
      throw new GraphQLError(ERROR_MESSAGES.MISSING_UPDATE_FIELDS);
    }

    const updateData = {
      key,
      label,
      expiresAt,
      description,
      default: defaultKey
    };

    if (defaultKey) {
      // find the current default key and set it to false
      await PublicKeyModel.updateMany(
        {
          owner: userID,
          default: true
        },
        {
          default: false
        }
      );
    }

    if (key) {
      // ensure the key being added is unique
      const count = await PublicKeyModel.countDocuments({
        owner: userID,
        key
      });

      if (count > 0) {
        throw new GraphQLError(ERROR_MESSAGES.PUBLIC_KEY_EXISTS);
      }
    }

    const updatedPublicKey = (
      await PublicKeyModel.findByIdAndUpdate(
        {
          _id: id,
          owner: userID
        },
        {...updateData},
        {new: true, runValidators: true}
      )
    )?.toObject();

    if (!updatedPublicKey) {
      throw new GraphQLError(ERROR_MESSAGES.ERROR_UPDATING_PUBLIC_KEY);
    }

    return updatedPublicKey as UpdatePublicKeyMutationPayload;
  } catch (error) {
    logger.error(error);
    // if the error message is in our error messages object, throw that error message
    if (String(error) in ERROR_MESSAGES) {
      throw new GraphQLError(ERROR_MESSAGES[String(error) as keyof typeof ERROR_MESSAGES]);
    } else {
      throw new GraphQLError(ERROR_MESSAGES.ERROR_UPDATING_PUBLIC_KEY);
    }
  }
};
