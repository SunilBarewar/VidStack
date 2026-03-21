import { toNodeHandler } from "better-auth/node";
import cors from "cors";
import express from "express";

import { auth } from "./config/auth";
import { env } from "./config/env";
import { uploadRouter } from "./routes/upload.routes";
import { logger } from "./utils/logger";

const app = express();
const port = env.PORT;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());

app.use((req, res, next) => {
  console.log("Received request", req.method, req.path);
  next();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
  logger.debug("Response sent");
});

app.use("/api", uploadRouter);

app.listen(port, () => {
  logger.info(`Example app listening on port ${port}`);
});
