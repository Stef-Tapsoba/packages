// errors.ts
export class UserError extends Error { }
export class UserNotFoundError extends UserError { }
export class InvalidProfileError extends UserError { }