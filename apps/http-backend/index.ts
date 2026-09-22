import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.routes";

const app = express();

app.use(cors({
  origin: "http://localhost:3000", 
  credentials: true, 
}));

app.use(express.json());

app.use("/api/v1/auth", authRouter);

app.listen(4000, ()=>{
    console.log("Server is running on port 4000");
})
