import express from 'express';
import { json, urlencoded } from 'body-parser';
import { router } from './views';
import multer from 'multer';

export const app = express();

app.use(json());
app.use(urlencoded({ extended: true }));
app.use(multer().any());
app.use('/', router);
