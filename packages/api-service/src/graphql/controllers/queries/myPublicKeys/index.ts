import {GraphQLError} from 'graphql';
import {logger} from '../../../../utils/';
import {enforceUserSession} from '../../helpers/enforceUserSession';
import type {
  AuthContext,
  IPublicKeyDocument,
  QueryMyPublicKeysResponse
} from 'passwordkeeper.types';

export const myPublicKeys = async (
  _: undefined,
  __: undefined,
  context: AuthContext | undefined
): Promise<QueryMyPublicKeysResponse[]> => {
  try {
    const session = enforceUserSession(context as AuthContext);

    // retrieve the public keys from the user session
    const sanitizedPublicKeys: QueryMyPublicKeysResponse[] = session?.user?.publicKeys?.map(
      ({_id, key, expiresAt}: IPublicKeyDocument) => ({
        _id,
        key,
        expiresAt
      })
    );

    return sanitizedPublicKeys;
  } catch (error) {
    logger.error('Query MyPublicKeys:: error -', error);
    throw new GraphQLError('Error getting public keys');
  }
};
