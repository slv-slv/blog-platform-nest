import { NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Request, Response } from 'express';
import { SETTINGS } from '../../settings.js';

export class ExtractUserId implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.locals.userId = null;
      return next();
    }

    const [authMethod, token] = authHeader.split(' ');

    if (authMethod !== 'Bearer' || !token) {
      res.locals.userId = null;
      return next();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: SETTINGS.JWT_PRIVATE_KEY });
      const { sub } = payload;
      res.locals.userId = sub;
      return next();
    } catch {
      res.locals.userId = null;
      return next();
    }
  }
}
