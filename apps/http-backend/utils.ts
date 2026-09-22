const secret = process.env.JWT_SECRET;

if (!secret) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

export const JWT_SECRET: string = secret;