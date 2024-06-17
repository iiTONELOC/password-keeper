import {createAppServer} from './server';
import {describe, expect, it} from '@jest/globals';
import type {AppServer} from 'passwordkeeper.types';

let appServer3: AppServer;

beforeAll(async () => {
  appServer3 = createAppServer(3003);
  await appServer3.start(3003);
});

afterAll(async () => {
  await appServer3.stop();
});

describe('Create App Server', () => {
  it('Should be a function', () => {
    expect(createAppServer).toBeInstanceOf(Function);
  });

  it('Should return an object with app, server, start, and stop properties', () => {
    const appServer: AppServer = createAppServer(3001);
    expect(appServer).toHaveProperty('app');
    expect(appServer).toHaveProperty('server');
    expect(appServer).toHaveProperty('start');
    expect(appServer).toHaveProperty('stop');
  });

  it('Should start and stop the server', async () => {
    const appServer: AppServer = createAppServer(3002);
    await appServer.start(3001);
    await appServer.stop();

    expect(
      await fetch('http://localhost:3002')
        .then(data => data)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .catch(_ => 'Error')
    ).toBe('Error');
  });
});

describe('App Server', () => {
  it('Should return 404 for unknown routes', async () => {
    const serverResponse = await fetch('http://localhost:3003/unknown');
    expect(serverResponse.status).toBe(404);
  });

  it('Should have an /api/v1/ route that echoes the version', async () => {
    const serverResponse = await fetch('http://localhost:3003/api/v1/');
    const response = await serverResponse.text();
    expect(response).toStrictEqual('Version 1');
  });

  it('Should return 404 for unknown api routes', async () => {
    const serverResponse = await fetch('http://localhost:3003/api/v2/');
    expect(serverResponse.status).toBe(404);
  });
});
