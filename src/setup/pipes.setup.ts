import { BadRequestException, INestApplication, ValidationError, ValidationPipe } from '@nestjs/common';

export function pipesSetup(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const errorsMessages = errors.map((error) => ({
          message: Object.values(error.constraints!)[0],
          field: error.property,
        }));
        throw new BadRequestException({ errorsMessages });
      },
    }),
  );
}
