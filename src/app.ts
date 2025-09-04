import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = new Hono();

//operation
//CRUD
app.get("/", (c) => c.text("Hello World today"));
app.get("/profile", async (c) => {
    //get data from db
    const profile = await prisma.profile.findMany();
    //response
    return c.json({
        message: "get data complete",
        data: profile
    }, 200);
    
});

export default app;