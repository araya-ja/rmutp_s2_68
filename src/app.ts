import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { Md5 } from "md5-typescript";
import { encrypt, decrypt } from "./security";

const prisma = new PrismaClient();
const app = new Hono();

// --- Encryption helpers for DB fields ---
function encryptProfileFields(body: any) {
  if (typeof body.mobile === 'string') body.mobile = encrypt(body.mobile);
  if (typeof body.cardId === 'string') body.cardId = encrypt(body.cardId);
  return body;
}
function decryptProfile(record: any) {
  try {
    if (typeof record.mobile === 'string') record.mobile = decrypt(record.mobile);
    if (typeof record.cardId === 'string') record.cardId = decrypt(record.cardId);
  } catch (e) {
    console.warn("Decrypt warning:", (e as Error).message);
  }
  if ('password' in record) delete record.password;
  return record;
}

app.get("/", (c) => c.text("Hello World Today!"));

app.get("/profile", async (c) => {
  const profiles = await prisma.profile.findMany();
  const out = profiles.map(decryptProfile);
  return c.json({ message: "get data completed", data: out }, 200);
});

app.post("/profile", async (c) => {
  const body = await c.req.json();
  const passwordHash = await bcrypt.hash(body.password, 13);
  body.password = passwordHash;

  //encrypt mobile
  body.mobile = encrypt(body.mobile);

  //encrypt cardId
  body.cardId = encrypt(body.cardId);

  body.status = false;
  const result = await prisma.profile.create({ data: body })
    .then(data => { 
        const out = decryptProfile(data);
        console.log('create profile completed', out);
        return out;
    })
    .catch(err => {
        console.log(`create profile failed `, JSON.stringify(err?.message));
        return "please recheck username, mobile or cardId";
    });

  return c.json({ message: "create profile completed", data: result });
});

app.get("/profile/:id", async (c) => {
  const id = c.req.param('id');
  const profile = await prisma.profile.findFirstOrThrow({ where: { id } });
  const out = decryptProfile(profile);
  return c.json({ message: "get data completed", data: out }, 200);
});

app.post("/encode", async (c) => {
  const body = await c.req.json();
  const passwordHash = await bcrypt.hash(body.password, 13);
  body.password = passwordHash;
  body.mobile = encrypt(body.mobile);
  body.cardId = encrypt(body.cardId);
  body.status = false;

  const result = await prisma.profile.create({ data: body })
    .then(data => { 
        const out = decryptProfile(data);
        return out;
    })
    .catch(err => {
        return "please recheck username, mobile or cardId";
    });

  return c.json({ message: "encode completed", data: result });
});

app.post("/decode", async (c) => {
  const body = await c.req.json();
  const id = body?.id;
  if (!id) return c.json({ message: "id is required" }, 400);
  const profile = await prisma.profile.findFirstOrThrow({ where: { id } });
  const out = decryptProfile(profile);
  return c.json({ message: "get data completed", data: out }, 200);
});

export default app;
