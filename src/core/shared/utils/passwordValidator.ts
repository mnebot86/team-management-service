

export type PasswordValidationResult = {
  valid: boolean;
  message?: string;
};

const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  NUMBER: /\d/,
  SPECIAL: /[^A-Za-z0-9]/,
  NO_SPACES: /^\S+$/,
};

export const validatePassword = (value: unknown): PasswordValidationResult => {
  if (typeof value !== 'string') {
    return { valid: false, message: 'Password must be a string' };
  }

  const password = value.trim();

  if (!password) {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < PASSWORD_RULES.MIN_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${PASSWORD_RULES.MIN_LENGTH} characters`,
    };
  }

  if (!PASSWORD_RULES.NO_SPACES.test(password)) {
    return { valid: false, message: 'Password cannot contain spaces' };
  }

  if (!PASSWORD_RULES.UPPERCASE.test(password)) {
    return { valid: false, message: 'Password must include at least one uppercase letter' };
  }

  if (!PASSWORD_RULES.LOWERCASE.test(password)) {
    return { valid: false, message: 'Password must include at least one lowercase letter' };
  }

  if (!PASSWORD_RULES.NUMBER.test(password)) {
    return { valid: false, message: 'Password must include at least one number' };
  }

  if (!PASSWORD_RULES.SPECIAL.test(password)) {
    return { valid: false, message: 'Password must include at least one special character' };
  }

  return { valid: true };
};
