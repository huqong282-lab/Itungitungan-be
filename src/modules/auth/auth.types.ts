export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  name: string;
};

export type AuthResult = {
  user: AuthUser;
  sessionToken: string;
};

export type AuthErrorCode = "INVALID_CREDENTIALS" | "EMAIL_ALREADY_EXISTS";

export class AuthError extends Error {
  constructor(public readonly code: AuthErrorCode) {
    super(code);
    this.name = "AuthError";
  }
}

export type RegisterResult = AuthResult;
