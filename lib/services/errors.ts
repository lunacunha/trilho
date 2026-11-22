// Errors thrown by services. The entry layer turns them into user-facing messages.

/** The resource does not exist or does not belong to the user (SPEC §10: "Not found"). */
export class NotFoundError extends Error {
  constructor() {
    super("Not found");
    this.name = "NotFoundError";
  }
}

/** The user's role cannot perform this action (US07-1: "Access denied"). */
export class AccessDeniedError extends Error {
  constructor() {
    super("Access denied");
    this.name = "AccessDeniedError";
  }
}

/** The input breaks a business rule the service enforces itself (e.g. R6). */
export class ValidationError extends Error {
  constructor(
    readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
