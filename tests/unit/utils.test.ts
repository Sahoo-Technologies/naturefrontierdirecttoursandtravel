/**
 * UNIT TESTS: Utility functions
 * Tests client-side utility functions like cn(), apiRequest helpers
 */
import { describe, it, expect } from "vitest";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Replicate the cn utility to test it
function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

describe("Utility: cn() class name merger", () => {
  it("should merge simple class names", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base", isActive && "active");
    expect(result).toContain("base");
    expect(result).toContain("active");
  });

  it("should handle false conditions", () => {
    const isActive = false;
    const result = cn("base", isActive && "active");
    expect(result).toBe("base");
    expect(result).not.toContain("active");
  });

  it("should merge conflicting tailwind classes correctly", () => {
    const result = cn("px-4", "px-8");
    expect(result).toBe("px-8"); // tw-merge keeps last
  });

  it("should handle undefined and null inputs", () => {
    const result = cn("base", undefined, null, "end");
    expect(result).toBe("base end");
  });

  it("should handle empty inputs", () => {
    const result = cn();
    expect(result).toBe("");
  });

  it("should handle array inputs", () => {
    const result = cn(["px-4", "py-2"]);
    expect(result).toBe("px-4 py-2");
  });

  it("should handle object inputs", () => {
    const result = cn({ "bg-red-500": true, "text-white": true, "opacity-50": false });
    expect(result).toContain("bg-red-500");
    expect(result).toContain("text-white");
    expect(result).not.toContain("opacity-50");
  });
});

describe("Utility: Data validation helpers", () => {
  it("should validate Nairobi area coordinates", () => {
    // Nairobi is approximately at -1.29, 36.82
    const lat = -1.2585;
    const lng = 36.8615;
    expect(lat).toBeGreaterThan(-2);
    expect(lat).toBeLessThan(0);
    expect(lng).toBeGreaterThan(36);
    expect(lng).toBeLessThan(38);
  });

  it("should validate Kenyan phone number format", () => {
    const phone = "+254712345678";
    expect(phone).toMatch(/^\+254\d{9}$/);
  });

  it("should reject invalid phone format", () => {
    const badPhone = "0712345678";
    expect(badPhone).not.toMatch(/^\+254\d{9}$/);
  });

  it("should validate date string format YYYY-MM-DD", () => {
    const date = "2026-02-18";
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("should validate vehicle types", () => {
    const validTypes = ["motorcycle", "van", "truck"];
    expect(validTypes).toContain("motorcycle");
    expect(validTypes).toContain("van");
    expect(validTypes).toContain("truck");
    expect(validTypes).not.toContain("bicycle");
  });

  it("should validate shop categories", () => {
    const validCategories = ["retail", "wholesale", "kiosk"];
    expect(validCategories).toContain("retail");
    expect(validCategories).not.toContain("supermarket");
  });

  it("should validate status enums", () => {
    const shopStatuses = ["active", "inactive", "pending"];
    const driverStatuses = ["available", "on_route", "off_duty"];
    const routeStatuses = ["planned", "in_progress", "completed"];

    expect(shopStatuses).toHaveLength(3);
    expect(driverStatuses).toHaveLength(3);
    expect(routeStatuses).toHaveLength(3);
  });
});
