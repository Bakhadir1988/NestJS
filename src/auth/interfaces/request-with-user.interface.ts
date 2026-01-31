// src/auth/interfaces/request-with-user.interface.ts

import { Request } from 'express';

import { UserFromJwt } from './user-from-jwt.interface';

export interface RequestWithUser extends Request {
  user: UserFromJwt;
}
