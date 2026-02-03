import { validateSync } from 'class-validator';

export function validateOrThrow<T extends object>(config: T): T {
  const errors = validateSync(config, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length) {
    throw new Error(`Invalid config: ${JSON.stringify(errors)}`);
  }

  return config;
}
