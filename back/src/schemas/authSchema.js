const { z } = require("zod");

const signupSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(60, "Name must not exceed 60 characters").optional(),
    userName: z.string().trim().min(2, "Username must be at least 2 characters").max(60).optional(),
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters long"),
  }).refine((data) => data.name || data.userName, {
    message: "Name is required",
    path: ["name"],
  }),
});

const signinSchema = z.object({
  body: z.object({
    email: z.string().trim().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

module.exports = {
  signupSchema,
  signinSchema,
};
