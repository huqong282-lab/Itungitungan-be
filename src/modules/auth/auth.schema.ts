import { Type } from "typebox";

export const loginBodySchema = Type.Object({
  email: Type.String({ format: "email", maxLength: 254 }),
  password: Type.String({ minLength: 1, maxLength: 128 }),
});

export const registerBodySchema = Type.Object({
  email: Type.String({ format: "email", maxLength: 254 }),
  password: Type.String({ minLength: 8, maxLength: 128 }),
  name: Type.String({ minLength: 1, maxLength: 100 }),
});
