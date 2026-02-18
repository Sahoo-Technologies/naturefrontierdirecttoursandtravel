/**
 * INTEGRATION TESTS: Authentication flow
 * Tests login, session, and middleware behavior
 */
import { describe, it, expect } from "vitest";
import express, { type Request, Response, NextFunction } from "express";
import request from "supertest";

function createAuthTestApp() {
  const app = express();
  app.use(express.json());

  // Simulated user store
  const users = new Map<string, { id: string; email: string; passwordHash: string; role: string }>();
  users.set("admin@test.com", {
    id: "u1",
    email: "admin@test.com",
    passwordHash: "$2a$10$hashedpassword", // bcrypt wouldn't match but we skip real hashing here
    role: "admin",
  });

  // Simulated session
  let currentSession: { userId: string } | null = null;

  // Auth middleware
  function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (!currentSession) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    next();
  }

  // Login (simplified - no bcrypt)
  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const user = users.get(email.toLowerCase());
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    // Simulate successful login
    if (password === "correct-password") {
      currentSession = { userId: user.id };
      const { passwordHash, ...userData } = user;
      return res.json(userData);
    }
    return res.status(401).json({ error: "Invalid email or password" });
  });

  // Logout
  app.post("/api/auth/logout", (_req, res) => {
    currentSession = null;
    res.json({ success: true });
  });

  // Get current user
  app.get("/api/auth/user", isAuthenticated, (req, res) => {
    const user = Array.from(users.values()).find((u) => u.id === currentSession!.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    const { passwordHash, ...userData } = user;
    res.json(userData);
  });

  // Protected route
  app.get("/api/protected", isAuthenticated, (_req, res) => {
    res.json({ data: "secret" });
  });

  // Forgot password
  app.post("/api/auth/forgot-password", (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
    // Always return success for security
    res.json({ success: true, message: "If your email exists, you will receive a reset link" });
  });

  // Reset password
  app.post("/api/auth/reset-password", (req, res) => {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    // In tests, any token is "invalid" since we don't seed one
    res.status(400).json({ error: "Invalid or expired token" });
  });

  return app;
}

// ============================================================
// AUTHENTICATION TESTS
// ============================================================
describe("Auth: Login flow", () => {
  const app = createAuthTestApp();

  it("should reject login without credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it("should reject login with wrong email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nonexistent@test.com",
      password: "whatever",
    });
    expect(res.status).toBe(401);
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "wrong-password",
    });
    expect(res.status).toBe(401);
  });

  it("should login with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "correct-password",
    });
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("admin@test.com");
    expect(res.body.role).toBe("admin");
    expect(res.body.passwordHash).toBeUndefined(); // should not expose hash
  });
});

describe("Auth: Protected routes", () => {
  it("should block unauthenticated access", async () => {
    const app = createAuthTestApp();
    const res = await request(app).get("/api/protected");
    expect(res.status).toBe(401);
  });

  it("should allow access after login", async () => {
    const app = createAuthTestApp();
    await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "correct-password",
    });
    const res = await request(app).get("/api/protected");
    expect(res.status).toBe(200);
    expect(res.body.data).toBe("secret");
  });

  it("should block access after logout", async () => {
    const app = createAuthTestApp();
    await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "correct-password",
    });
    await request(app).post("/api/auth/logout");
    const res = await request(app).get("/api/protected");
    expect(res.status).toBe(401);
  });
});

describe("Auth: Get current user", () => {
  it("should return 401 when not logged in", async () => {
    const app = createAuthTestApp();
    const res = await request(app).get("/api/auth/user");
    expect(res.status).toBe(401);
  });

  it("should return user data when logged in", async () => {
    const app = createAuthTestApp();
    await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "correct-password",
    });
    const res = await request(app).get("/api/auth/user");
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("admin@test.com");
    expect(res.body.passwordHash).toBeUndefined();
  });
});

describe("Auth: Logout", () => {
  it("should successfully logout", async () => {
    const app = createAuthTestApp();
    await request(app).post("/api/auth/login").send({
      email: "admin@test.com",
      password: "correct-password",
    });
    const res = await request(app).post("/api/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("Auth: Password reset flow", () => {
  const app = createAuthTestApp();

  it("should accept forgot-password request", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({
      email: "admin@test.com",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should return success even for non-existent email (security)", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({
      email: "fake@test.com",
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("should reject forgot-password without email", async () => {
    const res = await request(app).post("/api/auth/forgot-password").send({});
    expect(res.status).toBe(400);
  });

  it("should reject reset with missing fields", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/required/i);
  });

  it("should reject reset with short password", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      token: "some-token",
      password: "short",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });

  it("should reject reset with invalid token", async () => {
    const res = await request(app).post("/api/auth/reset-password").send({
      token: "invalid-token",
      password: "newpassword123",
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid|expired/i);
  });
});
