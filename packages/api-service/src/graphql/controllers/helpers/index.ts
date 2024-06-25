/* eslint-disable @typescript-eslint/no-unused-vars */
export * from './addPublicKey';
export * from './createAuthSession';
export * from './enforceUserSession';
export * from './findUsersPublicKey';
export * from './encryptPwdDataForEncryption';
import {GRAPHQL_ERROR_MESSAGES} from '../../errors/messages';

// build an array of the graphQL error messages
const errorMessages: string[] = [];

/**
 * Walks through an object calls the callback function for each value
 * @param obj
 * @param cb
 */
const walkObjForValues = (obj: unknown, cb: (key: string, value: unknown) => void) => {
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (typeof value === 'object') {
      walkObjForValues(value, cb);
    } else {
      cb(key, value);
    }
  }
};

// build an array of the error messages
walkObjForValues(GRAPHQL_ERROR_MESSAGES, (_, value) => {
  errorMessages.push(value as string);
});

/**
 * Ensures that the error message is handled correctly so that we are not sending
 * unsanitized error messages to the client. If the error message is not in the errorMessages array,
 * it will return the default message. IF the error message includes a duplicate key error, it will
 * return the duplicate key error message instead.
 *
 * @param error - the error object
 * @param errMessage - the error message as a string
 * @param defaultMsg - the default message to return if the error message is not in the errorMessages array
 * @returns
 */
const handleErrorMessage = (error: Error, errMessage: string, defaultMsg: string) => {
  let errorMessage: string = errorMessages.includes(errMessage) ? errMessage : defaultMsg;

  // check if the error message includes a duplicate key error
  if (errMessage.includes('E11000 duplicate key error collection')) {
    // @ts-expect-error - errorResponse is not a property of Error
    const keyPattern: string | undefined = error?.errorResponse?.keyPattern;
    const duplicateKeys = Object.keys(keyPattern ?? {}).join(', ');

    errorMessage = `Duplicate key error: ${duplicateKeys} already exists`;
  }

  return errorMessage;
};

/**
 * Displays the Error's message if it is in the errorMessages array
 *
 * If the error message is not in the errorMessages array, it will return the msg parameter
 * @param error
 * @param msg
 * @returns
 */
export const handleErrorMessages = (
  error: Error,
  msg = GRAPHQL_ERROR_MESSAGES.DEFAULT as string
): string => {
  const errMessage = String(error).replace('Error: ', '').trim();
  return handleErrorMessage(error, errMessage, msg);
};
