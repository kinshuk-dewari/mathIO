import { Router } from "express";
import { prisma } from "@repo/db/client";
import {
  loginSchema,
  registerSchema,
  zodErrorMessage,
} from "@repo/common/common";

import { compare, hash } from "bcryptjs";
import { sign } from "jsonwebtoken";
import { JWT_SECRET } from "../utils";

export const authRouter = Router();

// Register Route

authRouter.post("/register", async (req, res) => {
  try {
    const { success, data, error } = registerSchema.safeParse(req.body);

    if (!success) {
      res.status(403).json({ message: zodErrorMessage({ error }) });
      return;
    }
    const { email, password } = data;

    const exixtingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (exixtingUser) {
      res.status(409).json({ message: "User already exists" });
      return;
    }

    const username = email.split("@")[0]!;
    const hashedPassword = await hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
      },
    });

    return res.status(201).json({ message: "Registration successful" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// login route

authRouter.post("/login", async (req, res) => {
  try {
    const { success, data, error } = loginSchema.safeParse(req.body);

    if (!success) {
      res.status(403).json({ message: zodErrorMessage({ error }) });
      return;
    }
    const { email, password } = data;

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!existingUser) {
      res.status(409).json({ message: "User not found" });
      return;
    }

    const isPasswordValid = await compare(password, existingUser.password);

    if (!isPasswordValid) {
      res.status(401).json({ message: "Invalid password" });
      return;
    }

    const token = sign({ userId: existingUser.id }, JWT_SECRET);

    return res
      .status(201)
      .json({ message: "Login successful", data: { token } });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

// profile route
authRouter.post("/me", async (req, res) => {
  try {
    const userId = req.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      omit: {
        password: true,
      },
      include: {
        rating: true,
        gameMember: {
          include: {
            game: true,
          },
        },
      },
    });

    return res.json({ message: "User found", data: { user } });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
});
