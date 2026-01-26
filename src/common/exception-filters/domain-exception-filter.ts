import { Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { DomainException } from '../exceptions/domain-exceptions.js';

@Catch(DomainException)
export class DomainExceptionFilter extends BaseExceptionFilter {
  catch(domainException: DomainException, host: ArgumentsHost) {
    const httpCode = domainException.getHttpCode();
    const response =
      httpCode === HttpStatus.BAD_REQUEST
        ? {
            errorsMessages: [{ message: domainException.message, field: domainException.field ?? 'unknown' }],
          }
        : domainException.message;

    const httpException = new HttpException(response, httpCode);
    super.catch(httpException, host);
  }
}
