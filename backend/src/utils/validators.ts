const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && EMAIL_REGEX.test(email.trim());
}

export interface RegisterInput {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

export interface LoginInput {
  email?: unknown;
  password?: unknown;
}

/**
 * Returns an array of human-readable validation errors, or an empty array
 * if the input is valid.
 */
export function validateRegisterInput(input: RegisterInput): string[] {
  const errors: string[] = [];

  if (typeof input.name !== "string" || input.name.trim().length < 2) {
    errors.push("Name must be at least 2 characters long.");
  }

  if (!isValidEmail(input.email)) {
    errors.push("Please provide a valid email address.");
  }

  if (
    typeof input.password !== "string" ||
    input.password.length < MIN_PASSWORD_LENGTH
  ) {
    errors.push(
      `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`
    );
  }

  return errors;
}

export function validateLoginInput(input: LoginInput): string[] {
  const errors: string[] = [];

  if (!isValidEmail(input.email)) {
    errors.push("Please provide a valid email address.");
  }

  if (typeof input.password !== "string" || input.password.length === 0) {
    errors.push("Password is required.");
  }

  return errors;
}

export interface UpdateProfileInput {
  name?: unknown;
  phone?: unknown;
  profileImage?: unknown;
}

const PHONE_REGEX = /^[+0-9\s\-().]{7,25}$/;

export function validateProfileUpdateInput(input: UpdateProfileInput): string[] {
  const errors: string[] = [];

  if (input.name !== undefined) {
    if (typeof input.name !== "string" || input.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters long.");
    }
  }

  if (input.phone !== undefined && input.phone !== null && input.phone !== "") {
    if (typeof input.phone !== "string" || !PHONE_REGEX.test(input.phone.trim())) {
      errors.push("Please provide a valid phone number (7-25 characters, digits and standard symbols).");
    }
  }

  if (input.profileImage !== undefined && input.profileImage !== null && input.profileImage !== "") {
    if (typeof input.profileImage !== "string") {
      errors.push("Invalid profile image URL format.");
    }
  }

  return errors;
}

export interface ChangePasswordInput {
  currentPassword?: unknown;
  newPassword?: unknown;
}

export function validateChangePasswordInput(input: ChangePasswordInput): string[] {
  const errors: string[] = [];

  if (typeof input.currentPassword !== "string" || input.currentPassword.length === 0) {
    errors.push("Current password is required.");
  }

  if (
    typeof input.newPassword !== "string" ||
    input.newPassword.length < MIN_PASSWORD_LENGTH
  ) {
    errors.push(`New password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
  }

  return errors;
}
