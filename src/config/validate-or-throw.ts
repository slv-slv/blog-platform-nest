import { validateSync } from 'class-validator';

export function validateOrThrow<T extends object>(config: T, name = 'config'): T {
  const errors = validateSync(config, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length) {
    throw new Error(`Invalid ${name}: ${JSON.stringify(errors)}`);
  }

  return config;
}
