import {findUsersPublicKey} from '.';
import {expect, describe, it} from '@jest/globals';
import {IPublicKeyDocument, IUserDocument} from 'passwordkeeper.types';

const testUser: IUserDocument = {
  // @ts-expect-error - testing the function
  _id: 'testUserId',
  username: 'testUser',
  email: 'testUser@test.com',
  userRole: 'Account Owner',
  // @ts-expect-error - testing the function
  publicKeys: [
    {_id: 'testPublicKeyId_1', key: 'testPublicKey1'},
    {_id: 'testPublicKeyId_2', key: 'testPublicKey2'}
  ] as IPublicKeyDocument[]
};

describe('findUsersPublicKey', () => {
  it('should return the first public key if no id is provided', () => {
    const result = findUsersPublicKey(testUser);
    expect(result).toBe('testPublicKey1');
  });

  it('should return the public key if the id is provided', () => {
    const result = findUsersPublicKey(testUser, 'testPublicKeyId_2');
    expect(result).toBe('testPublicKey2');
  });

  it('should return the first public key if the id is not found', () => {
    const result = findUsersPublicKey(testUser, 'testPublicKeyId_3');
    expect(result).toBe('testPublicKey1');
  });

  it('should return undefined if the user has no public keys', () => {
    testUser.publicKeys = [];

    const result = findUsersPublicKey(testUser);
    expect(result).toBeUndefined();
  });
});
