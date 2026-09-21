import type { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import { JWT_SECRET } from "./utils";

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try{
      const brearerToken = req.headers.authorization;
    
      if(!brearerToken || !brearerToken.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    
      const extractedToken = brearerToken.split("Bearer ")[1];
    
      if(!extractedToken) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    
      const decoded = verify(extractedToken, JWT_SECRET);
    
      req.userId = decoded;
      next();

  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};