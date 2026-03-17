import { Injectable, NestMiddleware } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NextFunction, Response } from 'express';
import { RequestWithOptionalUserId } from '../types/requests.type.js';

@Injectable()
export class ExtractUserId implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  async use(req: RequestWithOptionalUserId, _res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      req.userId = null;
      return next();
    }

    const [authMethod, token] = authHeader.split(' ');

    if (authMethod !== 'Bearer' || !token) {
      req.userId = null;
      return next();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      req.userId = payload.sub ?? null;
      return next();
    } catch {
      req.userId = null;
      return next();
    }
  }
}
