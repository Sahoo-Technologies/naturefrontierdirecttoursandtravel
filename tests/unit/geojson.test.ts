/**
 * UNIT TESTS: GeoJSON data validation
 * Validates the structure and data of the Huruma/Mathare GeoJSON
 */
import { describe, it, expect } from "vitest";

// GeoJSON type definitions
interface GeoJSONFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: any;
  };
}

interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// Minimal test GeoJSON matching the app's structure
const testGeoJSON: GeoJSONFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "Huruma", area_type: "residential" },
      geometry: {
        type: "Polygon",
        coordinates: [[[36.858, -1.262], [36.868, -1.262], [36.868, -1.272], [36.858, -1.272], [36.858, -1.262]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Mathare", area_type: "residential" },
      geometry: {
        type: "Polygon",
        coordinates: [[[36.855, -1.255], [36.865, -1.255], [36.865, -1.262], [36.855, -1.262], [36.855, -1.255]]],
      },
    },
    {
      type: "Feature",
      properties: { name: "Juja Road", road_type: "primary" },
      geometry: {
        type: "LineString",
        coordinates: [[36.85, -1.258], [36.86, -1.259], [36.87, -1.26]],
      },
    },
  ],
};

describe("GeoJSON: Structure validation", () => {
  it("should be a valid FeatureCollection", () => {
    expect(testGeoJSON.type).toBe("FeatureCollection");
    expect(Array.isArray(testGeoJSON.features)).toBe(true);
    expect(testGeoJSON.features.length).toBeGreaterThan(0);
  });

  it("each feature should have type 'Feature'", () => {
    for (const feature of testGeoJSON.features) {
      expect(feature.type).toBe("Feature");
    }
  });

  it("each feature should have properties and geometry", () => {
    for (const feature of testGeoJSON.features) {
      expect(feature.properties).toBeDefined();
      expect(feature.geometry).toBeDefined();
      expect(feature.geometry.type).toBeDefined();
      expect(feature.geometry.coordinates).toBeDefined();
    }
  });

  it("should contain Huruma area", () => {
    const huruma = testGeoJSON.features.find((f) => f.properties.name === "Huruma");
    expect(huruma).toBeDefined();
    expect(huruma!.geometry.type).toBe("Polygon");
  });

  it("should contain Mathare area", () => {
    const mathare = testGeoJSON.features.find((f) => f.properties.name === "Mathare");
    expect(mathare).toBeDefined();
    expect(mathare!.geometry.type).toBe("Polygon");
  });

  it("should contain road features", () => {
    const roads = testGeoJSON.features.filter((f) => f.geometry.type === "LineString");
    expect(roads.length).toBeGreaterThan(0);
  });
});

describe("GeoJSON: Coordinate validation", () => {
  it("all coordinates should be within Nairobi bounds", () => {
    const NAIROBI_BOUNDS = {
      minLat: -1.5,
      maxLat: -1.1,
      minLng: 36.6,
      maxLng: 37.1,
    };

    function validateCoords(coords: any): void {
      if (typeof coords[0] === "number") {
        // [lng, lat] pair
        const [lng, lat] = coords;
        expect(lat).toBeGreaterThanOrEqual(NAIROBI_BOUNDS.minLat);
        expect(lat).toBeLessThanOrEqual(NAIROBI_BOUNDS.maxLat);
        expect(lng).toBeGreaterThanOrEqual(NAIROBI_BOUNDS.minLng);
        expect(lng).toBeLessThanOrEqual(NAIROBI_BOUNDS.maxLng);
      } else {
        for (const nested of coords) {
          validateCoords(nested);
        }
      }
    }

    for (const feature of testGeoJSON.features) {
      validateCoords(feature.geometry.coordinates);
    }
  });

  it("polygons should be closed (first point equals last)", () => {
    const polygons = testGeoJSON.features.filter((f) => f.geometry.type === "Polygon");
    for (const polygon of polygons) {
      for (const ring of polygon.geometry.coordinates) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        expect(first[0]).toBe(last[0]); // lng
        expect(first[1]).toBe(last[1]); // lat
      }
    }
  });

  it("LineString features should have at least 2 points", () => {
    const lines = testGeoJSON.features.filter((f) => f.geometry.type === "LineString");
    for (const line of lines) {
      expect(line.geometry.coordinates.length).toBeGreaterThanOrEqual(2);
    }
  });
});
