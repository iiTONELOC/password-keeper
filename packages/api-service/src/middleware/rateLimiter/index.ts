/* eslint-disable @typescript-eslint/no-unused-vars */
import {Request, Response} from 'express';
import {rateLimit} from 'express-rate-limit';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator(request: Request, _: Response): string {
    if (!request.ip) {
      console.error('Warning: request.ip is missing!');
      return request.socket.remoteAddress ?? '';
    }

    return request.ip.replace(/:\d+[^:]*$/, '');
  }
});
