import type {AuthContext} from 'passwordkeeper.types';

export const withAuthContext = async (req: Express.Request): Promise<AuthContext | undefined> => {
  return undefined;
};
