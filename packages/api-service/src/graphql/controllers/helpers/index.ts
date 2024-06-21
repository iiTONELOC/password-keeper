export * from './addPublicKey';
export * from './createAuthSession';
export * from './enforceUserSession';
export * from './findUsersPublicKey';

export const handleErrorMessages = (
  error: Error,
  msg = 'Error occurred while fetching data. Please try again.'
): string => {
  const errMessage = String(error);
  return errMessage?.includes('Error:') ? errMessage : msg;
};
