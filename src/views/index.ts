import express from 'express';
import { cashDrawerRouter } from './CashDrawer';

export const router = express.Router();

router.use('/cash-drawer', cashDrawerRouter);
