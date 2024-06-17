/* eslint-disable @typescript-eslint/consistent-type-definitions */
import {exec} from 'child_process';
import {TestUserCreationData} from './';
import {CompleteAccountMutationPayload} from 'passwordkeeper.types';

export type SessionReadyProps = {
  testUserData: TestUserCreationData;
  authSession: CompleteAccountMutationPayload;
  keyName: string;
};

//using the session-nonce script we can get the values we need to pass to the headers
export const getSessionReadyForAuthMiddleware = async (
  props: SessionReadyProps
): Promise<{sessionId: string | undefined; signature: string | undefined}> => {
  // Use the session-nonce script to get the sessionId and signature
  // This script can only be run in test and development environments
  const command = `npm run session-nonce -- ${props.authSession.nonce} ${
    props.testUserData.createdAuthSession.user.username
  } ${props.testUserData.createdAuthSession.user._id?.toString()} ${props.authSession._id} ${
    props.keyName
  }`;
  // prettier-ignore
  const result = new Promise((resolve, reject) => {
    exec(command, (error, stdout) => {
      if (error) {
        reject(error);
      }
      resolve(stdout);
    });
  });

  // wait for the result of the script
  const data = (await result) as string;
  let sessionId: string | undefined;
  let signature: string | undefined;

  // get the sessionId and signature from the result
  // store the sessionId and signature to use in the headers for the tests
  for (const line of data.split('\n')) {
    const [key, value] = line.split(':');
    if (key === 'Encrypted Session ID') {
      sessionId = value.trim();
    } else if (key === 'Signature') {
      signature = value.trim();
    }
  }

  return {sessionId, signature};
};
