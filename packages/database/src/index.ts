import "dotenv/config";

export { prisma } from "./client"; // exports instance of prisma
export * from "../generated/prisma"; // exports generated types from prisma (please run `pnpm run db:generate` command if there is no generated types)
