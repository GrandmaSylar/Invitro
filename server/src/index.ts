import "reflect-metadata";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { ConfigService } from "./services/configService";
import { DatabaseManager } from "./services/dbManager";
import settingsRouter from "./routes/settings";
import authRouter from "./routes/auth";
import catalogRouter from "./routes/catalog";
import registryRouter from "./routes/registry";
import patientsRouter from "./routes/patients";
import setupRouter from "./routes/setup";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/settings', settingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/catalog', catalogRouter);
app.use('/api/registry', registryRouter);
app.use('/api/patients', patientsRouter);
app.use('/api/setup', setupRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, async () => {
  console.log(`Server is running heavily on http://localhost:${PORT}`);
  
  // Bootstrap Database
  const activeConfig = ConfigService.getActiveConfig();
  if (activeConfig) {
    console.log(`Initial Boot: Attempting to connect to active DB: ${activeConfig.name}`);
    await DatabaseManager.initializeActiveConnection(activeConfig);
  } else {
    console.log('Initial Boot: No active database config found. Waiting for setup.');
  }
});
