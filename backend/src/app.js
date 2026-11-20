import express from "express";
import cors from "cors";
import apiRoutes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/error.middleware.js";

// The Express app is created here (without starting the server)
// so that tests can use it directly.
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "100kb" }));

app.use("/api", apiRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
