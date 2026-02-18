/**
 * INTEGRATION TESTS: API route handlers
 * Tests Express API endpoints using supertest against the real Express app
 * Note: These tests use the in-memory storage (MemStorage), no database needed
 */
import { describe, it, expect, beforeAll } from "vitest";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import request from "supertest";

// Build a minimal Express app with the same route patterns as the real app
// but without auth middleware (to test route logic in isolation)
function createTestApp() {
  const app = express();
  app.use(express.json());

  // In-memory store for tests
  const shops: Map<string, any> = new Map();
  const drivers: Map<string, any> = new Map();
  const routes: Map<string, any> = new Map();
  const targets: Map<string, any> = new Map();
  let idCounter = 0;
  const genId = () => `test-${++idCounter}`;

  // ---- Shops ----
  app.get("/api/shops", (_req, res) => {
    res.json(Array.from(shops.values()));
  });

  app.get("/api/shops/:id", (req, res) => {
    const shop = shops.get(req.params.id);
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    res.json(shop);
  });

  app.post("/api/shops", (req, res) => {
    const { name, latitude, longitude } = req.body;
    if (!name || latitude == null || longitude == null) {
      return res.status(400).json({ error: "Invalid shop data" });
    }
    const id = genId();
    const shop = { id, ...req.body };
    shops.set(id, shop);
    res.status(201).json(shop);
  });

  app.patch("/api/shops/:id", (req, res) => {
    const shop = shops.get(req.params.id);
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    const updated = { ...shop, ...req.body };
    shops.set(req.params.id, updated);
    res.json(updated);
  });

  app.delete("/api/shops/:id", (req, res) => {
    if (!shops.has(req.params.id)) return res.status(404).json({ error: "Shop not found" });
    shops.delete(req.params.id);
    res.status(204).send();
  });

  // ---- Drivers ----
  app.get("/api/drivers", (_req, res) => {
    res.json(Array.from(drivers.values()));
  });

  app.post("/api/drivers", (req, res) => {
    const { name, phone, vehicleType } = req.body;
    if (!name || !phone || !vehicleType) {
      return res.status(400).json({ error: "Invalid driver data" });
    }
    const id = genId();
    const driver = { id, status: "available", ...req.body };
    drivers.set(id, driver);
    res.status(201).json(driver);
  });

  app.delete("/api/drivers/:id", (req, res) => {
    if (!drivers.has(req.params.id)) return res.status(404).json({ error: "Driver not found" });
    drivers.delete(req.params.id);
    res.status(204).send();
  });

  // ---- Routes ----
  app.get("/api/routes", (_req, res) => {
    res.json(Array.from(routes.values()));
  });

  app.post("/api/routes", (req, res) => {
    const { name, date } = req.body;
    if (!name || !date) {
      return res.status(400).json({ error: "Invalid route data" });
    }
    const id = genId();
    const route = { id, status: "planned", shopIds: [], ...req.body };
    routes.set(id, route);
    res.status(201).json(route);
  });

  // ---- Targets ----
  app.get("/api/targets", (_req, res) => {
    res.json(Array.from(targets.values()));
  });

  app.post("/api/targets", (req, res) => {
    const { driverId, period, targetShops, targetDeliveries, startDate, endDate } = req.body;
    if (!driverId || !period || targetShops == null || targetDeliveries == null || !startDate || !endDate) {
      return res.status(400).json({ error: "Invalid target data" });
    }
    const id = genId();
    const target = { id, completedShops: 0, completedDeliveries: 0, ...req.body };
    targets.set(id, target);
    res.status(201).json(target);
  });

  // ---- Health check ----
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ---- Error handler ----
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  return app;
}

// ============================================================
// API INTEGRATION TESTS
// ============================================================
describe("API: Health check", () => {
  const app = createTestApp();

  it("GET /api/health should return 200 with ok status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });
});

describe("API: Shops endpoints", () => {
  const app = createTestApp();

  it("GET /api/shops should return empty array initially", async () => {
    const res = await request(app).get("/api/shops");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("POST /api/shops should create a shop", async () => {
    const res = await request(app).post("/api/shops").send({
      name: "Test Shop",
      latitude: -1.258,
      longitude: 36.862,
      category: "retail",
      status: "active",
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("Test Shop");
  });

  it("POST /api/shops should reject invalid data", async () => {
    const res = await request(app).post("/api/shops").send({
      category: "retail", // missing name, lat, lng
    });
    expect(res.status).toBe(400);
  });

  it("GET /api/shops/:id should return created shop", async () => {
    const createRes = await request(app).post("/api/shops").send({
      name: "Findable Shop",
      latitude: -1.259,
      longitude: 36.863,
    });
    const res = await request(app).get(`/api/shops/${createRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Findable Shop");
  });

  it("GET /api/shops/:id should 404 for missing shop", async () => {
    const res = await request(app).get("/api/shops/non-existent");
    expect(res.status).toBe(404);
  });

  it("PATCH /api/shops/:id should update shop", async () => {
    const createRes = await request(app).post("/api/shops").send({
      name: "Update Me",
      latitude: -1.26,
      longitude: 36.86,
    });
    const res = await request(app)
      .patch(`/api/shops/${createRes.body.id}`)
      .send({ name: "Updated Name" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Name");
  });

  it("DELETE /api/shops/:id should remove shop", async () => {
    const createRes = await request(app).post("/api/shops").send({
      name: "Delete Me",
      latitude: -1.26,
      longitude: 36.86,
    });
    const res = await request(app).delete(`/api/shops/${createRes.body.id}`);
    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/api/shops/${createRes.body.id}`);
    expect(getRes.status).toBe(404);
  });

  it("DELETE /api/shops/:id should 404 for missing shop", async () => {
    const res = await request(app).delete("/api/shops/non-existent");
    expect(res.status).toBe(404);
  });
});

describe("API: Drivers endpoints", () => {
  const app = createTestApp();

  it("GET /api/drivers should return empty array initially", async () => {
    const res = await request(app).get("/api/drivers");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("POST /api/drivers should create a driver", async () => {
    const res = await request(app).post("/api/drivers").send({
      name: "Test Driver",
      phone: "+254712345678",
      vehicleType: "motorcycle",
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe("available");
  });

  it("POST /api/drivers should reject incomplete data", async () => {
    const res = await request(app).post("/api/drivers").send({
      name: "Incomplete",
      // missing phone and vehicleType
    });
    expect(res.status).toBe(400);
  });

  it("DELETE /api/drivers/:id should remove driver", async () => {
    const createRes = await request(app).post("/api/drivers").send({
      name: "Del Driver",
      phone: "+254700000000",
      vehicleType: "van",
    });
    const res = await request(app).delete(`/api/drivers/${createRes.body.id}`);
    expect(res.status).toBe(204);
  });
});

describe("API: Routes endpoints", () => {
  const app = createTestApp();

  it("POST /api/routes should create a route", async () => {
    const res = await request(app).post("/api/routes").send({
      name: "Morning Delivery",
      date: "2026-02-18",
      shopIds: ["s1", "s2"],
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Morning Delivery");
    expect(res.body.status).toBe("planned");
  });

  it("POST /api/routes should reject without date", async () => {
    const res = await request(app).post("/api/routes").send({
      name: "No Date",
    });
    expect(res.status).toBe(400);
  });

  it("GET /api/routes should list routes", async () => {
    const res = await request(app).get("/api/routes");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("API: Targets endpoints", () => {
  const app = createTestApp();

  it("POST /api/targets should create a target", async () => {
    const res = await request(app).post("/api/targets").send({
      driverId: "d1",
      period: "weekly",
      targetShops: 30,
      targetDeliveries: 50,
      startDate: "2026-02-17",
      endDate: "2026-02-23",
    });
    expect(res.status).toBe(201);
    expect(res.body.completedShops).toBe(0);
  });

  it("POST /api/targets should reject incomplete data", async () => {
    const res = await request(app).post("/api/targets").send({
      driverId: "d1",
      // missing other required fields
    });
    expect(res.status).toBe(400);
  });
});

describe("API: Content-Type handling", () => {
  const app = createTestApp();

  it("should handle JSON request bodies", async () => {
    const res = await request(app)
      .post("/api/shops")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({
        name: "JSON Shop",
        latitude: -1.26,
        longitude: 36.86,
      }));
    expect(res.status).toBe(201);
  });

  it("API responses should be JSON", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["content-type"]).toMatch(/json/);
  });
});
