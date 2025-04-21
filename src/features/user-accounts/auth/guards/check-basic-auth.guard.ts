import { Observable } from '.store/rxjs-npm-7.8.2-80ecda9013/package';
import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { SETTINGS } from '../../../../settings.js';

@Injectable()
export class CheckBasicAuth implements CanActivate {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const req = context.switchToHttp().getRequest();

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const [authMethod, credsBase64] = authHeader.split(' ');
    const credentials = SETTINGS.CREDENTIALS;

    if (authMethod !== 'Basic') {
      throw new UnauthorizedException('Invalid authorization method');
    }

    if (!credentials.map((user) => user.base64).includes(credsBase64)) {
      throw new UnauthorizedException('Incorrect credentials');
    }

    return true;
  }
}
