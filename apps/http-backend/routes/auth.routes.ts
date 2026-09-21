import { Router } from "express";
import {prisma} from "@repo/db/client"

export const authRouter = Router();

authRouter.post("/register")
authRouter.post("/login")
authRouter.post("/me")