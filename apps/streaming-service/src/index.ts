import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

import { auth } from "./config/auth";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const app = express();
const port = env.PORT;

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"],
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use((req, res, next) => {
  logger.debug("Request received");
  next();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
  logger.debug("Response sent");
});

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}`);
});
