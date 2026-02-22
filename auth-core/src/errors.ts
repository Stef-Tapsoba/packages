// errors.ts
export class AuthError extends Error { }
export class InvalidCredentialsError extends AuthError { }
export class SessionExpiredError extends AuthError { }