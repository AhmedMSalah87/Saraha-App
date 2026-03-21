export class AppError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized", code = "AUTH_ERROR") {
    super(message, code, 401);
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input", code = "VALIDATION_ERROR") {
    super(message, code, 400);
  }
}

export class DuplicateEntryError extends AppError {
  constructor(field) {
    super(`${field} already exists`, "DUPLICATE_ENTRY", 409);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "resource") {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}
