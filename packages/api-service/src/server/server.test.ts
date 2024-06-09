import {createAppServer} from './server';
import {AppServer} from '../../../types';
import {describe, expect, it} from '@jest/globals';

describe('Create App Server', () => {
  it('Should be a function', () => {
    expect(createAppServer).toBeInstanceOf(Function);
  });

  it('Should return an object with app, server, start, and stop properties', () => {
    const appServer: AppServer = createAppServer();
    expect(appServer).toHaveProperty('app');
    expect(appServer).toHaveProperty('server');
    expect(appServer).toHaveProperty('start');
    expect(appServer).toHaveProperty('stop');
  });

  it('Should start the server', async () => {
    const appServer: AppServer = createAppServer();
    appServer.start(3001);

    const serverResponse = await fetch('http://localhost:3001');
    expect(serverResponse.status).toStrictEqual(200);
    appServer.stop();
  });

  it('Should stop the server', async () => {
    const appServer: AppServer = createAppServer();
    appServer.start(3002);
    appServer.stop();

    expect(
      await fetch('http://localhost:3002')
        .then(data => data)
        .catch(_ => 'Error')
    ).toBe('Error');
  });
});

describe('App Server', () => {
  let appServer: AppServer;
  beforeAll(() => {
    appServer = createAppServer();
    appServer.start(3000);
  });
  afterAll(() => {
    appServer.stop();
  });

  it('Should return 404 for unknown routes', async () => {
    const serverResponse = await fetch('http://localhost:3000/unknown');
    expect(serverResponse.status).toBe(404);
  });

  it('Should have an /api/v1/ route that echoes the version', async () => {
    const serverResponse = await fetch('http://localhost:3000/api/v1/');
    const response = await serverResponse.text();
    expect(response).toStrictEqual('Version 1');
  });

  it('Should return 404 for unknown api routes', async () => {
    const serverResponse = await fetch('http://localhost:3000/api/v2/');
    expect(serverResponse.status).toBe(404);
  });

  it('Should have an /api/v1/public-key route that returns a PKI public-key', async () => {
    const serverResponse = await fetch('http://localhost:3000/api/v1/public-key');
    expect(serverResponse.status).toStrictEqual(200);
  });

  it('Should have a GraphQL route', async () => {
    const serverResponse = await fetch('http://localhost:3000/api/v1/graphql');
    expect(serverResponse.status).toStrictEqual(200);
  });
});
