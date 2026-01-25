import { Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { DomainException } from '../exceptions/domain-exceptions.js';

@Catch(DomainException)
export class DomainExceptionFilter extends BaseExceptionFilter {
  catch(domainException: DomainException, host: ArgumentsHost) {
    const httpException = new HttpException(domainException.message, domainException.getHttpCode());
    super.catch(httpException, host);
  }
}
