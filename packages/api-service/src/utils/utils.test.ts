import {describe, expect, it} from '@jest/globals';
import {getAppsPrivateKey, getAppsPublicKey} from 'passwordkeeper.graphql';

describe('getAppsPrivateKey', () => {
  it("should be able to get the app's private key", async () => {
    const privateKey = await getAppsPrivateKey();
    expect(privateKey).toBeDefined();
  });
});

describe('getAppsPublicKey', () => {
  it("should be able to get the app's public key", async () => {
    const publicKey = await getAppsPublicKey();
    expect(publicKey).toBeDefined();
  });
});
