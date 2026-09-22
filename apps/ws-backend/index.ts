import { WebSocketServer, WebSocket } from "ws";
import { verify, type JwtPayload } from "jsonwebtoken";
import {prisma} from "@repo/db/client"

const wss = new WebSocketServer({ port: 8080 });
const JWT_SECRET = process.env.JWT_SECRET ?? "";

export type User = {
    id : string;
    name : string;
    ws : WebSocket;
}

const onlineUsers:Map<string,User> = new Map();

wss.on("connection",async(ws,req)=>{

    const token = req.url?.split("?token=")[1];

    if(!token){
        ws.close();
        return;
    }

    let decoded;
    try{
        decoded = verify(token, JWT_SECRET) as JwtPayload;
    }
    catch(err){
        ws.close();
        return;
    }

    const user = await prisma.user.findUnique({
        where:{
            id: decoded.userId
        }
    })

    if(!user){
        ws.close();
        return;
    }

    onlineUsers.set(decoded.userId, {
        name: user.username,
        ws,
        id:user.id
    });

    wss.clients.forEach((ws)=>{
        ws.send(JSON.stringify({
            type:"ONLINE_USERS",
            payload:{
                users: Array.from(onlineUsers)
            }
        }))
    })

    ws.on("message",(event)=>{
        const parsedData=JSON.parse(event.toString());
    })
})