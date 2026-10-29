// seed-loadtest.ts
import { prisma } from "@repo/db/client";
import { writeFileSync } from "node:fs";

const N = 2000;
const data = Array.from({ length: N }, (_, i) => ({
  username: `loadbot_${i}`,
  email: `loadbot_${i}@example.com`,
  password: "loadtest-password",
}));
await prisma.user.createMany({ data, skipDuplicates: true });
const users = await prisma.user.findMany({
  where: { username: { startsWith: "loadbot_" } },
  select: { id: true },
});
writeFileSync("loadtest-users.json", JSON.stringify(users.map((u) => u.id)));
console.log("seeded", users.length);