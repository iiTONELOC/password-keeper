/* eslint-disable @typescript-eslint/consistent-type-definitions */

export type AuthSessionErrorMessages = {
  SESSION_EXPIRED: 'Session expired';
  SESSION_NOT_FOUND: 'Session not found';
  NOT_AUTHENTICATED: 'Not Authenticated';
  CREATE_SESSION_ERROR: 'Error creating session';
  NONCE_CREATION_ERROR: 'Error creating nonce for session';
  AES_KEY_CREATION_ERROR: 'Error creating AES key for session';
  INVALID_ACCOUNT_STATUS_FOR_AUTHENTICATION: 'Invalid account status for authentication';
  PUBLIC_KEY_NONCE_ENCRYPTION_ERROR: 'Error encrypting nonce with public key for session';
  PUBLIC_KEY_SESSION_ID_ENCRYPTION_ERROR: 'Error encrypting session id with public key for session';
};

export type GetLoginNonceErrorMessages = {
  USER_NOT_FOUND: 'User not found';
  USERNAME_REQUIRED: 'Username is required';
  ERROR_SIGNING_NONCE: 'Error signing nonce';
  CHALLENGE_REQUIRED: 'Challenge is required';
  SIGNATURE_REQUIRED: 'Signature is required';
  NONCE_CREATION_ERROR: 'Error creating nonce';
  PRIVATE_KEY_ERROR: 'Error getting private key';
  PUBLIC_KEY_NOT_FOUND: 'User public key not found';
  CREATE_INVITE_ERROR: 'Error creating login invite';
  NONCE_SIGNING_ERROR: 'Error signing nonce with public key';
  RE_ENCRYPT_CHALLENGE_ERROR: 'Error re-encrypting challenge';
  NONCE_ENCRYPTION_AT_REST_ERROR: 'Error encrypting nonce at rest';
  SIGNATURE_VERIFICATION_FAILED: 'User signature verification failed';
  CHALLENGE_ENCRYPTION_AT_REST_ERROR: 'Error encrypting challenge at rest';
  CHALLENGE_DECRYPT_ERROR: 'Error decrypting challenge! The communication may have been tampered with';
};

export type LoginErrorMessages = {
  PUBLIC_KEY_NOT_FOUND: 'Public key not found';
  LOGIN_INVITE_NOT_FOUND: 'Login invite not found';
  FETCH_PRIVATE_KEY_ERROR: 'Error fetching private key';
  NONCE_REQUIRED: 'Nonce is required for login completion';
  SIGNATURE_VERIFICATION_FAILED: 'Signature verification failed';
  SIGNATURE_REQUIRED: 'Signature is required for login completion';
  ERROR_DECRYPTING_NONCE: 'Error decrypting nonce for login completion';
  ERROR_GETTING_PRIVATE_KEY: 'Error getting private key for login completion';
  NONCE_NOT_EQUAL: 'The nonce provided does not match the nonce stored on the server';
  SERVER_SIDE_NONCE_DECRYPT_ERROR: 'Error decrypting nonce from the server side! The communication may have been tampered with';
};

export type UserErrorMessages = {
  NOT_FOUND: 'User not found';
  UPDATE_ERROR: 'Error updating user';
  EMAIL_REQUIRED: 'Email is required';
  NONCE_ERROR: 'Error generating nonce';
  ALREADY_EXISTS: 'User already exists';
  CREATE_USER_ERROR: 'Error creating user';
  UPDATE_USER_ERROR: 'Error updating user';
  DELETE_USER_ERROR: 'Error deleting user';
  USERNAME_REQUIRED: 'Username is required';
  SIGNING_NONCE_ERROR: 'Error signing nonce';
  FETCH_PRIVATE_KEY_ERROR: 'Error fetching private key';
};

export type AccountErrorMessages = {
  COMPLETE_ACCOUNT_ERROR: 'Error completing account';
  INVITE_NOT_FOUND: 'Account Completion invite not found';
  PUBLIC_KEY_RETRIEVAL_ERROR: 'Error retrieving public key';
  NONCE_REQUIRED: 'Nonce is required for account completion';
  PUBLIC_KEY_REQUIRED: 'Public key is required for account completion';
  NONCE_DECRYPT_ERROR: 'Error decrypting nonce for account completion';
};

export type PublicKeyErrorMessages = {
  NOT_FOUND: 'Public key not found';
  DUPLICATE_KEY: 'Public key already exists';
  PUBLIC_KEY_EXISTS: 'Public key already exists';
  MISSING_REQUIRED_FIELDS: 'Missing required fields';
  MAX_KEYS_REACHED: 'Max number of public keys reached';
  ERROR_UPDATING_PUBLIC_KEY: 'Error updating public key';
  ERROR_DELETING_PUBLIC_KEY: 'Error deleting public key';
  CANNOT_DELETE_DEFAULT_KEY: 'Cannot delete default key';
  LAST_KEY: 'Cannot delete last key a default key is missing';
  MISSING_UPDATE_FIELDS: 'One of the following fields must be provided: key, label, defaultKey, description, or expiresAt';
};

export type GraphQLErrorMessages = {
  DEFAULT: 'Error occurred while fetching data. Please try again.';
  USER_ERROR_MESSAGES: UserErrorMessages;
  ACCOUNT_ERROR_MESSAGES: AccountErrorMessages;
  PUBLIC_KEY_ERROR_MESSAGES: PublicKeyErrorMessages;
  LOGIN_ERROR_MESSAGES: LoginErrorMessages;
  AUTH_SESSION_ERROR_MESSAGES: AuthSessionErrorMessages;
  GET_LOGIN_NONCE_ERROR_MESSAGES: GetLoginNonceErrorMessages;
};
