import path from 'path';
import {createAppServer} from '../../../../server';
import {describe, expect, it} from '@jest/globals';
import {getPublicKey} from '../../../../utils/crypto';
import {AppServer} from 'passwordkeeper.types';

const keyFolder = process.env.KEYS_PATH;
const pathToKeyFolder = path.resolve(process.cwd(), keyFolder ?? './keys');
const publicKeyPath = path.resolve(pathToKeyFolder, 'pwd-keeper_public.pem');

describe('Public Key API', () => {
  it('should return the public key', async () => {
    const publicKey: string | undefined = await getPublicKey(publicKeyPath);

    const appServer: AppServer = createAppServer(3004);

    await appServer.start();

    const response = await fetch('http://localhost:3004/api/v1/public-key');

    const publicKeyText = await response.text();

    expect(response.status).toBe(200);
    expect(publicKeyText).toBe(publicKey);

    expect.assertions(2);

    await appServer.stop();
  });
});
