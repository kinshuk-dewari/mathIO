import { WebSocketServer } from "ws";
import { verify, type JwtPayload } from "jsonwebtoken";


const wss = new WebSocketServer({ port: 8080 });
const JWT_SECRET = process.env.JWT_SECRET ?? "";

const online_users = new Map();

wss.on("connection",(ws,req)=>{

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

    ws.on("message",(event)=>{
        const parsedData=JSON.parse(event.toString());

        if(parsedData.type==="JOIN"){
            online_users.set()
        }
    })
})