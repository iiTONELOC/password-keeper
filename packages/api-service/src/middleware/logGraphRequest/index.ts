import {Request} from 'express';
import {logger} from 'passwordkeeper.logger';
import {IAuthSessionDocument} from 'passwordkeeper.types';

export const logGraphRequest = (req: Request, context: IAuthSessionDocument): void => {
  const {body} = req;
  const {ip, headers} = req;
  const {operationName, query} = body;
  const userAgent = headers['user-agent'];

  logger.http(
    `${ip} - user ${context?.user?._id ?? 'unknown'} - query: ${operationName ?? 'unknown'}`
  );

  !operationName &&
    logger.error(
      `\tUnknown query: ${JSON.stringify(query, null, 2)}\n\t${ip} - user agent: ${userAgent}`
    );
};
