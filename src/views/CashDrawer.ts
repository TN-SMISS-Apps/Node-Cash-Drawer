import { RequestHandler, Router } from 'express';
import { BadRequestError, CashDrawerOpenResponse } from '../types';
import { attemptToOpenDrawer } from '../utils/cashDrawer';
import { log } from '../utils/logger';

export const cashDrawerRouter = Router();

const OpenView: RequestHandler = (_, res) => {
  attemptToOpenDrawer()
    .then((_) => {
      const resp: CashDrawerOpenResponse = { message_sent: true };
      log('opened a drawer through api request');
      res.send(resp);
    })
    .catch((err: Error) => {
      const errorResp: BadRequestError = {
        error_code: 'COM_PORT',
        message: err.message,
        error: err,
      };
      log('error while processing api request: ', err.message);
      res.status(409).send(errorResp);
    });
};

cashDrawerRouter.post('/open', OpenView);
