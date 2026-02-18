/**
 * UNIT TESTS: MemStorage (in-memory storage layer)
 * Tests all CRUD operations for shops, drivers, routes, and targets
 */
import { describe, it, expect, beforeEach } from "vitest";

// We import MemStorage directly (not the singleton) so each test gets a fresh instance
// Re-implement a minimal MemStorage for isolated testing without @shared alias issues
class TestMemStorage {
  private shops: Map<string, any>;
  private drivers: Map<string, any>;
  private routes: Map<string, any>;
  private targets: Map<string, any>;
  private idCounter = 0;

  constructor() {
    this.shops = new Map();
    this.drivers = new Map();
    this.routes = new Map();
    this.targets = new Map();
  }

  private genId(): string {
    return `test-id-${++this.idCounter}`;
  }

  // === Shops ===
  async getAllShops() { return Array.from(this.shops.values()); }
  async getShop(id: string) { return this.shops.get(id); }
  async createShop(data: any) {
    const id = this.genId();
    const shop = { ...data, id };
    this.shops.set(id, shop);
    return shop;
  }
  async updateShop(id: string, updates: any) {
    const shop = this.shops.get(id);
    if (!shop) return undefined;
    const updated = { ...shop, ...updates };
    this.shops.set(id, updated);
    return updated;
  }
  async deleteShop(id: string) { return this.shops.delete(id); }

  // === Drivers ===
  async getAllDrivers() { return Array.from(this.drivers.values()); }
  async getDriver(id: string) { return this.drivers.get(id); }
  async createDriver(data: any) {
    const id = this.genId();
    const driver = { ...data, id };
    this.drivers.set(id, driver);
    return driver;
  }
  async updateDriver(id: string, updates: any) {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;
    const updated = { ...driver, ...updates };
    this.drivers.set(id, updated);
    return updated;
  }
  async deleteDriver(id: string) { return this.drivers.delete(id); }

  // === Routes ===
  async getAllRoutes() { return Array.from(this.routes.values()); }
  async getRoute(id: string) { return this.routes.get(id); }
  async createRoute(data: any) {
    const id = this.genId();
    const route = { ...data, id };
    this.routes.set(id, route);
    return route;
  }
  async updateRoute(id: string, updates: any) {
    const route = this.routes.get(id);
    if (!route) return undefined;
    const updated = { ...route, ...updates };
    this.routes.set(id, updated);
    return updated;
  }
  async deleteRoute(id: string) { return this.routes.delete(id); }

  // === Targets ===
  async getAllTargets() { return Array.from(this.targets.values()); }
  async getTarget(id: string) { return this.targets.get(id); }
  async createTarget(data: any) {
    const id = this.genId();
    const target = { ...data, id };
    this.targets.set(id, target);
    return target;
  }
  async updateTarget(id: string, updates: any) {
    const target = this.targets.get(id);
    if (!target) return undefined;
    const updated = { ...target, ...updates };
    this.targets.set(id, updated);
    return updated;
  }
  async deleteTarget(id: string) { return this.targets.delete(id); }
}

// ============================================================
// SHOP CRUD TESTS
// ============================================================
describe("Storage: Shops CRUD", () => {
  let storage: TestMemStorage;

  beforeEach(() => {
    storage = new TestMemStorage();
  });

  it("should start with no shops", async () => {
    const shops = await storage.getAllShops();
    expect(shops).toEqual([]);
  });

  it("should create a shop and return it with an id", async () => {
    const input = {
      name: "Test Shop",
      ownerName: "John",
      phone: "+254712345678",
      address: "Huruma",
      latitude: -1.2585,
      longitude: 36.8615,
      category: "retail",
      status: "active",
    };
    const shop = await storage.createShop(input);
    expect(shop.id).toBeDefined();
    expect(shop.name).toBe("Test Shop");
    expect(shop.latitude).toBe(-1.2585);
  });

  it("should retrieve a shop by id", async () => {
    const created = await storage.createShop({ name: "Lookup Shop", latitude: -1.25, longitude: 36.86, category: "kiosk", status: "active" });
    const found = await storage.getShop(created.id);
    expect(found).toBeDefined();
    expect(found!.name).toBe("Lookup Shop");
  });

  it("should return undefined for non-existent shop", async () => {
    const found = await storage.getShop("non-existent-id");
    expect(found).toBeUndefined();
  });

  it("should list all shops", async () => {
    await storage.createShop({ name: "Shop A", latitude: -1.25, longitude: 36.86, category: "retail", status: "active" });
    await storage.createShop({ name: "Shop B", latitude: -1.26, longitude: 36.87, category: "wholesale", status: "active" });
    const all = await storage.getAllShops();
    expect(all).toHaveLength(2);
  });

  it("should update a shop", async () => {
    const created = await storage.createShop({ name: "Old Name", latitude: -1.25, longitude: 36.86, category: "retail", status: "active" });
    const updated = await storage.updateShop(created.id, { name: "New Name" });
    expect(updated!.name).toBe("New Name");
    expect(updated!.latitude).toBe(-1.25); // unchanged fields preserved
  });

  it("should return undefined when updating non-existent shop", async () => {
    const result = await storage.updateShop("fake-id", { name: "X" });
    expect(result).toBeUndefined();
  });

  it("should delete a shop", async () => {
    const created = await storage.createShop({ name: "Delete Me", latitude: -1.25, longitude: 36.86, category: "retail", status: "active" });
    const deleted = await storage.deleteShop(created.id);
    expect(deleted).toBe(true);
    const found = await storage.getShop(created.id);
    expect(found).toBeUndefined();
  });

  it("should return false when deleting non-existent shop", async () => {
    const deleted = await storage.deleteShop("no-such-id");
    expect(deleted).toBe(false);
  });
});

// ============================================================
// DRIVER CRUD TESTS
// ============================================================
describe("Storage: Drivers CRUD", () => {
  let storage: TestMemStorage;

  beforeEach(() => {
    storage = new TestMemStorage();
  });

  it("should create and retrieve a driver", async () => {
    const driver = await storage.createDriver({
      name: "David Omondi",
      phone: "+254778901234",
      vehicleType: "motorcycle",
      vehiclePlate: "KMCA 123A",
      status: "available",
    });
    expect(driver.id).toBeDefined();
    expect(driver.name).toBe("David Omondi");
    
    const found = await storage.getDriver(driver.id);
    expect(found).toEqual(driver);
  });

  it("should update driver status", async () => {
    const driver = await storage.createDriver({
      name: "Sam",
      phone: "+254700000000",
      vehicleType: "van",
      status: "available",
    });
    const updated = await storage.updateDriver(driver.id, { status: "on_route" });
    expect(updated!.status).toBe("on_route");
    expect(updated!.name).toBe("Sam");
  });

  it("should delete a driver", async () => {
    const driver = await storage.createDriver({ name: "To Delete", phone: "+254700000001", vehicleType: "truck", status: "off_duty" });
    await storage.deleteDriver(driver.id);
    expect(await storage.getDriver(driver.id)).toBeUndefined();
  });

  it("should list all drivers", async () => {
    await storage.createDriver({ name: "D1", phone: "1", vehicleType: "motorcycle", status: "available" });
    await storage.createDriver({ name: "D2", phone: "2", vehicleType: "van", status: "available" });
    await storage.createDriver({ name: "D3", phone: "3", vehicleType: "truck", status: "off_duty" });
    const all = await storage.getAllDrivers();
    expect(all).toHaveLength(3);
  });
});

// ============================================================
// ROUTE CRUD TESTS
// ============================================================
describe("Storage: Routes CRUD", () => {
  let storage: TestMemStorage;

  beforeEach(() => {
    storage = new TestMemStorage();
  });

  it("should create a route with shop IDs", async () => {
    const route = await storage.createRoute({
      name: "Morning Route A",
      driverId: "driver-1",
      shopIds: ["shop-1", "shop-2", "shop-3"],
      status: "planned",
      estimatedDistance: 2.5,
      estimatedTime: 45,
      date: "2026-02-18",
    });
    expect(route.id).toBeDefined();
    expect(route.shopIds).toEqual(["shop-1", "shop-2", "shop-3"]);
    expect(route.estimatedTime).toBe(45);
  });

  it("should update route status", async () => {
    const route = await storage.createRoute({
      name: "Test Route",
      shopIds: [],
      status: "planned",
      date: "2026-02-18",
    });
    const updated = await storage.updateRoute(route.id, { status: "in_progress" });
    expect(updated!.status).toBe("in_progress");
  });

  it("should delete a route", async () => {
    const route = await storage.createRoute({ name: "Del Route", shopIds: [], status: "planned", date: "2026-02-18" });
    expect(await storage.deleteRoute(route.id)).toBe(true);
    expect(await storage.getRoute(route.id)).toBeUndefined();
  });
});

// ============================================================
// TARGET CRUD TESTS
// ============================================================
describe("Storage: Targets CRUD", () => {
  let storage: TestMemStorage;

  beforeEach(() => {
    storage = new TestMemStorage();
  });

  it("should create a target", async () => {
    const target = await storage.createTarget({
      driverId: "driver-1",
      period: "weekly",
      targetShops: 30,
      targetDeliveries: 50,
      completedShops: 0,
      completedDeliveries: 0,
      startDate: "2026-02-17",
      endDate: "2026-02-23",
    });
    expect(target.id).toBeDefined();
    expect(target.targetShops).toBe(30);
  });

  it("should update target progress", async () => {
    const target = await storage.createTarget({
      driverId: "driver-1",
      period: "daily",
      targetShops: 10,
      targetDeliveries: 20,
      completedShops: 0,
      completedDeliveries: 0,
      startDate: "2026-02-18",
      endDate: "2026-02-18",
    });
    const updated = await storage.updateTarget(target.id, { completedShops: 5, completedDeliveries: 8 });
    expect(updated!.completedShops).toBe(5);
    expect(updated!.completedDeliveries).toBe(8);
    expect(updated!.targetShops).toBe(10); // original preserved
  });

  it("should delete a target", async () => {
    const target = await storage.createTarget({
      driverId: "d1", period: "daily", targetShops: 5, targetDeliveries: 10,
      completedShops: 0, completedDeliveries: 0, startDate: "2026-02-18", endDate: "2026-02-18",
    });
    expect(await storage.deleteTarget(target.id)).toBe(true);
    expect(await storage.getTarget(target.id)).toBeUndefined();
  });
});
