import { ValidationError, validateSync } from 'class-validator';

export function validateOrThrow<T extends object>(config: T, name = 'config'): T {
  const errors = validateSync(config, { whitelist: true, forbidNonWhitelisted: true });
  if (errors.length) {
    const formattedErrors = formatErrors(errors);
    throw new Error(`Invalid ${name}: ${JSON.stringify(formattedErrors)}`);
  }

  return config;
}

type FormattedValidationError = {
  property: string;
  constraints?: ValidationError['constraints'];
  children?: FormattedValidationError[];
};

function formatErrors(errors: ValidationError[]): FormattedValidationError[] {
  return errors.map((error) => {
    const property = error.property;
    const constraints = error.constraints;

    if (error.children?.length) {
      return { property, constraints, children: formatErrors(error.children) };
    }

    return { property, constraints };
  });
}
