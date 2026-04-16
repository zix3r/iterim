import { useCallback, useEffect, useRef, useState } from 'react';
import { validateValues } from '@/lib/validation';
import type { FormErrors, FormValidators, FormValues } from '@/lib/validation';

export function useFormValidation<T extends FormValues>(
  initialValues: T,
  validators: FormValidators<T>,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const initialValuesRef = useRef(initialValues);

  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);

  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => {
      if (!prev[field]) {
        return prev;
      }

      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validateField = useCallback(<K extends keyof T>(field: K) => {
    const fieldValidators = validators[field] ?? [];
    let error: string | undefined;

    for (const validator of fieldValidators) {
      const validationError = validator(values[field], values);
      if (validationError) {
        error = validationError;
        break;
      }
    }

    setErrors((prev) => {
      const next = { ...prev };
      if (error) {
        next[field] = error;
      } else {
        delete next[field];
      }
      return next;
    });

    return !error;
  }, [validators, values]);

  const validateForm = useCallback(() => {
    const nextErrors = validateValues(values, validators);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }, [validators, values]);

  const resetForm = useCallback((nextValues?: T) => {
    setValues(nextValues ?? initialValuesRef.current);
    setErrors({});
  }, []);

  return {
    values,
    setValues,
    setFieldValue,
    errors,
    setErrors,
    validateField,
    validateForm,
    resetForm,
  };
}
