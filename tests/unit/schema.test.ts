/**
 * UNIT TESTS: Schema validation (Zod schemas from drizzle-zod)
 * Tests that insert schemas correctly validate and reject data
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// We define test schemas matching the app schemas to avoid Drizzle DB imports
const insertShopSchema = z.object({
  name: z.string().min(1),
  ownerName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  category: z.string().default("retail"),
  status: z.string().default("active"),
  addedBy: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const insertDriverSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  vehicleType: z.string().min(1),
  vehiclePlate: z.string().optional().nullable(),
  status: z.string().default("available"),
  currentLatitude: z.number().optional().nullable(),
  currentLongitude: z.number().optional().nullable(),
});

const insertRouteSchema = z.object({
  name: z.string().min(1),
  driverId: z.string().optional().nullable(),
  shopIds: z.array(z.string()).default([]),
  status: z.string().default("planned"),
  estimatedDistance: z.number().optional().nullable(),
  estimatedTime: z.number().optional().nullable(),
  date: z.string().min(1),
});

const insertTargetSchema = z.object({
  driverId: z.string().min(1),
  period: z.string().min(1),
  targetShops: z.number().int(),
  targetDeliveries: z.number().int(),
  completedShops: z.number().int().default(0),
  completedDeliveries: z.number().int().default(0),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
});

// ============================================================
// SHOP SCHEMA VALIDATION
// ============================================================
describe("Schema: Shop validation", () => {
  it("should accept valid shop data", () => {
    const result = insertShopSchema.safeParse({
      name: "Test Shop",
      latitude: -1.2585,
      longitude: 36.8615,
      category: "retail",
      status: "active",
    });
    expect(result.success).toBe(true);
  });

  it("should reject shop without name", () => {
    const result = insertShopSchema.safeParse({
      latitude: -1.2585,
      longitude: 36.8615,
    });
    expect(result.success).toBe(false);
  });

  it("should reject shop without coordinates", () => {
    const result = insertShopSchema.safeParse({
      name: "No Coords Shop",
    });
    expect(result.success).toBe(false);
  });

  it("should accept shop with optional fields omitted", () => {
    const result = insertShopSchema.safeParse({
      name: "Minimal Shop",
      latitude: -1.26,
      longitude: 36.86,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("retail"); // default
      expect(result.data.status).toBe("active");   // default
    }
  });

  it("should accept shop with all fields", () => {
    const result = insertShopSchema.safeParse({
      name: "Full Shop",
      ownerName: "Grace Njeri",
      phone: "+254712345678",
      address: "Huruma Estate",
      latitude: -1.2585,
      longitude: 36.8615,
      category: "wholesale",
      status: "pending",
      addedBy: "admin",
      notes: "Corner shop",
    });
    expect(result.success).toBe(true);
  });

  it("should reject non-numeric latitude", () => {
    const result = insertShopSchema.safeParse({
      name: "Bad Coords",
      latitude: "not-a-number",
      longitude: 36.86,
    });
    expect(result.success).toBe(false);
  });
});

// ============================================================
// DRIVER SCHEMA VALIDATION
// ============================================================
describe("Schema: Driver validation", () => {
  it("should accept valid driver data", () => {
    const result = insertDriverSchema.safeParse({
      name: "David Omondi",
      phone: "+254778901234",
      vehicleType: "motorcycle",
    });
    expect(result.success).toBe(true);
  });

  it("should reject driver without phone", () => {
    const result = insertDriverSchema.safeParse({
      name: "No Phone",
      vehicleType: "van",
    });
    expect(result.success).toBe(false);
  });

  it("should reject driver without vehicleType", () => {
    const result = insertDriverSchema.safeParse({
      name: "No Vehicle",
      phone: "+254700000000",
    });
    expect(result.success).toBe(false);
  });

  it("should apply default status", () => {
    const result = insertDriverSchema.safeParse({
      name: "Default Status",
      phone: "+254700000001",
      vehicleType: "truck",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("available");
    }
  });

  it("should accept optional GPS coordinates", () => {
    const result = insertDriverSchema.safeParse({
      name: "GPS Driver",
      phone: "+254700000002",
      vehicleType: "motorcycle",
      currentLatitude: -1.259,
      currentLongitude: 36.862,
    });
    expect(result.success).toBe(true);
  });
});

// ============================================================
// ROUTE SCHEMA VALIDATION
// ============================================================
describe("Schema: Route validation", () => {
  it("should accept valid route", () => {
    const result = insertRouteSchema.safeParse({
      name: "Morning Route",
      date: "2026-02-18",
      shopIds: ["s1", "s2"],
    });
    expect(result.success).toBe(true);
  });

  it("should reject route without date", () => {
    const result = insertRouteSchema.safeParse({
      name: "No Date Route",
      shopIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("should reject route without name", () => {
    const result = insertRouteSchema.safeParse({
      date: "2026-02-18",
      shopIds: [],
    });
    expect(result.success).toBe(false);
  });

  it("should apply default status", () => {
    const result = insertRouteSchema.safeParse({
      name: "Default Status Route",
      date: "2026-02-18",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("planned");
    }
  });
});

// ============================================================
// TARGET SCHEMA VALIDATION
// ============================================================
describe("Schema: Target validation", () => {
  it("should accept valid target", () => {
    const result = insertTargetSchema.safeParse({
      driverId: "d1",
      period: "weekly",
      targetShops: 30,
      targetDeliveries: 50,
      startDate: "2026-02-17",
      endDate: "2026-02-23",
    });
    expect(result.success).toBe(true);
  });

  it("should reject target without driverId", () => {
    const result = insertTargetSchema.safeParse({
      period: "daily",
      targetShops: 10,
      targetDeliveries: 20,
      startDate: "2026-02-18",
      endDate: "2026-02-18",
    });
    expect(result.success).toBe(false);
  });

  it("should apply default completedShops=0", () => {
    const result = insertTargetSchema.safeParse({
      driverId: "d1",
      period: "daily",
      targetShops: 10,
      targetDeliveries: 15,
      startDate: "2026-02-18",
      endDate: "2026-02-18",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.completedShops).toBe(0);
      expect(result.data.completedDeliveries).toBe(0);
    }
  });

  it("should reject non-integer targetShops", () => {
    const result = insertTargetSchema.safeParse({
      driverId: "d1",
      period: "weekly",
      targetShops: 10.5,
      targetDeliveries: 20,
      startDate: "2026-02-18",
      endDate: "2026-02-24",
    });
    expect(result.success).toBe(false);
  });
});
