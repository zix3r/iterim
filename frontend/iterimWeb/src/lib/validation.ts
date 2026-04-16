export type FormValues = object;

export type FormErrors<T extends FormValues> = Partial<Record<keyof T, string>>;

export type FieldValidator<T extends FormValues, K extends keyof T> = (
  value: T[K],
  values: T,
) => string | undefined;

export type FormValidators<T extends FormValues> = Partial<{
  [K in keyof T]: FieldValidator<T, K>[];
}>;

const toTrimmedString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value == null) {
    return '';
  }

  return String(value).trim();
};

export const required = <T extends FormValues, K extends keyof T>(label: string): FieldValidator<T, K> => {
  return (value) => {
    if (toTrimmedString(value).length === 0) {
      return `${label} is required.`;
    }

    return undefined;
  };
};

export const email = <T extends FormValues, K extends keyof T>(label: string): FieldValidator<T, K> => {
  return (value) => {
    const normalized = toTrimmedString(value);
    if (normalized.length === 0) {
      return `${label} is required.`;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      return `Please enter a valid ${label.toLowerCase()}.`;
    }

    return undefined;
  };
};

export const minLength = <T extends FormValues, K extends keyof T>(
  label: string,
  min: number,
): FieldValidator<T, K> => {
  return (value) => {
    if (toTrimmedString(value).length < min) {
      return `${label} must be at least ${min} characters long.`;
    }

    return undefined;
  };
};

export const maxLength = <T extends FormValues, K extends keyof T>(
  label: string,
  max: number,
): FieldValidator<T, K> => {
  return (value) => {
    const normalized = toTrimmedString(value);
    if (normalized.length > 0 && normalized.length > max) {
      return `${label} cannot exceed ${max} characters.`;
    }

    return undefined;
  };
};

export const nonNegativeNumber = <T extends FormValues, K extends keyof T>(
  label: string,
): FieldValidator<T, K> => {
  return (value) => {
    const normalized = toTrimmedString(value);
    if (normalized.length === 0) {
      return undefined;
    }

    const parsed = Number(normalized);
    if (Number.isNaN(parsed)) {
      return `${label} must be a number.`;
    }

    if (parsed < 0) {
      return `${label} cannot be negative.`;
    }

    return undefined;
  };
};

export const dateOnOrAfter = <
  T extends FormValues,
  K extends keyof T,
  D extends keyof T,
>(
  dependentField: D,
  message: string,
): FieldValidator<T, K> => {
  return (value, values) => {
    const current = toTrimmedString(value);
    const dependent = toTrimmedString(values[dependentField]);

    if (!current || !dependent) {
      return undefined;
    }

    if (current < dependent) {
      return message;
    }

    return undefined;
  };
};

export const requiredWhen = <
  T extends FormValues,
  K extends keyof T,
  D extends keyof T,
>(
  dependentField: D,
  predicate: (dependentValue: T[D]) => boolean,
  message: string,
): FieldValidator<T, K> => {
  return (value, values) => {
    if (!predicate(values[dependentField])) {
      return undefined;
    }

    if (toTrimmedString(value).length === 0) {
      return message;
    }

    return undefined;
  };
};

export function validateValues<T extends FormValues>(
  values: T,
  validators: FormValidators<T>,
): FormErrors<T> {
  const errors: FormErrors<T> = {};

  (Object.keys(validators) as Array<keyof T>).forEach((field) => {
    const rules = validators[field] ?? [];
    for (const rule of rules) {
      const error = rule(values[field], values);
      if (error) {
        errors[field] = error;
        break;
      }
    }
  });

  return errors;
}
