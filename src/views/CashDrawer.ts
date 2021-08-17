import { RequestHandler, Router } from 'express';
import { BadRequestError, CashDrawerOpenResponse } from '../types';
import { attemptToOpenDrawer, adasysToOpenDrawer, ADASYS } from '../utils/cashDrawer';
import { log } from '../utils/logger';
import {mainWindow} from '../electron';
import { localStorage } from '../utils/localStorage';

export const cashDrawerRouter = Router();

const OpenView: RequestHandler = (_, res) => {
  const adasys = localStorage.get(ADASYS);
  if(adasys == true)
  adasysToOpenDrawer()
    .then((_) => {
      const resp: CashDrawerOpenResponse = { message_sent: true };
      log('opened a drawer through api request');
      res.send(resp);
    })
    .catch((err: Error) => {
      const errorResp: BadRequestError = {
        error_code: 'ADASYS_DLL',
        message: err.message,
        error: err,
      };
      log('error while processing api request: ', err.message);
      res.status(409).send(errorResp);
    });
  else
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
const ShowWindow:RequestHandler = (_, res) => {
  if(mainWindow?.isVisible()) mainWindow?.hide();
  else mainWindow?.show();
  res.sendStatus(200);
}
cashDrawerRouter.post('/open', OpenView);
cashDrawerRouter.get('/', ShowWindow);
