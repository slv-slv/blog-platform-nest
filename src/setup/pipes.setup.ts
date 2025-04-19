import { BadRequestException, INestApplication, ValidationError, ValidationPipe } from '@nestjs/common';

export function pipesSetup(app: INestApplication) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      stopAtFirstError: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const errorMessages = errors.map((error) => ({
          field: error.property,
          message: Object.values(error.constraints!)[0],
        }));
        throw new BadRequestException({ errorMessages });
      },
    }),
  );
}
