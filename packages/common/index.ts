import z from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export const zodErrorMessage = ({ error }: { error: z.ZodError }) => {
  return error.issues
    .map((err) => `path:${err.input}, message: ${err.message}`)
    .join(",");
};
