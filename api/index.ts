import type { Request, Response } from 'express';
import { app, initializeServer } from '../server';

let initialization: Promise<void> | undefined;

export default async function handler(req: Request, res: Response) {
  initialization ??= initializeServer();
  await initialization;
  return app(req, res);
}