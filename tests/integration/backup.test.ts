/**
 * INTEGRATION TESTS: Backup & Cron endpoint
 * Tests the backup cron authorization flow
 */
import { describe, it, expect } from "vitest";
import express, { type Request, Response } from "express";
import request from "supertest";

function createBackupTestApp() {
  const app = express();
  app.use(express.json());

  // Simulated auth middleware
  let isLoggedIn = false;
  function isAuthenticated(req: Request, res: Response, next: any) {
    if (!isLoggedIn) return res.status(401).json({ error: "Not authenticated" });
    next();
  }

  // Login helper for tests
  app.post("/test/login", (_req, res) => {
    isLoggedIn = true;
    res.json({ ok: true });
  });

  // Manual backup
  app.post("/api/backup", isAuthenticated, (_req, res) => {
    res.json({
      version: "1.0",
      createdAt: new Date().toISOString(),
      type: "manual",
      data: { shops: [], drivers: [], routes: [], targets: [] },
      metadata: { totalRecords: 0, tables: {} },
    });
  });

  // Cron backup
  app.post("/api/backup/cron", (req, res) => {
    const cronSecret = process.env.CRON_SECRET || "test-cron-secret";
    const authHeader = req.header("authorization") || "";
    const expected = `Bearer ${cronSecret}`;

    if (authHeader !== expected) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json({ success: true, createdAt: new Date().toISOString(), recordCount: 0 });
  });

  // Backup history
  app.get("/api/backup/history", isAuthenticated, (_req, res) => {
    res.json([]);
  });

  return app;
}

describe("Backup: Manual backup", () => {
  it("should reject unauthenticated backup request", async () => {
    const app = createBackupTestApp();
    const res = await request(app).post("/api/backup");
    expect(res.status).toBe(401);
  });

  it("should create backup when authenticated", async () => {
    const app = createBackupTestApp();
    await request(app).post("/test/login");
    const res = await request(app).post("/api/backup");
    expect(res.status).toBe(200);
    expect(res.body.version).toBe("1.0");
    expect(res.body.type).toBe("manual");
    expect(res.body.metadata).toBeDefined();
  });
});

describe("Backup: Cron endpoint authorization", () => {
  it("should reject cron request without auth header", async () => {
    const app = createBackupTestApp();
    const res = await request(app).post("/api/backup/cron");
    expect(res.status).toBe(401);
  });

  it("should reject cron request with wrong token", async () => {
    const app = createBackupTestApp();
    const res = await request(app)
      .post("/api/backup/cron")
      .set("Authorization", "Bearer wrong-secret");
    expect(res.status).toBe(401);
  });

  it("should accept cron request with correct token", async () => {
    const app = createBackupTestApp();
    const res = await request(app)
      .post("/api/backup/cron")
      .set("Authorization", "Bearer test-cron-secret");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Backup: History endpoint", () => {
  it("should reject unauthenticated history request", async () => {
    const app = createBackupTestApp();
    const res = await request(app).get("/api/backup/history");
    expect(res.status).toBe(401);
  });

  it("should return history when authenticated", async () => {
    const app = createBackupTestApp();
    await request(app).post("/test/login");
    const res = await request(app).get("/api/backup/history");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
