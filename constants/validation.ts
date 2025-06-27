/**
 * Validation constants for user input limits
 */
export const VALIDATION_LIMITS = {
  BIO_MAX_LENGTH: 150,
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
} as const;

export const VALIDATION_MESSAGES = {
  BIO_TOO_LONG: `Bio must be ${VALIDATION_LIMITS.BIO_MAX_LENGTH} characters or less`,
  USERNAME_TOO_SHORT: `Username must be at least ${VALIDATION_LIMITS.USERNAME_MIN_LENGTH} characters`,
  USERNAME_TOO_LONG: `Username must be ${VALIDATION_LIMITS.USERNAME_MAX_LENGTH} characters or less`,
} as const;
