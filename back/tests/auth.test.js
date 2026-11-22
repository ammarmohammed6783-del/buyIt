const test = require("node:test");
const assert = require("node:assert");
const { signupSchema, signinSchema } = require("../src/schemas/authSchema");
const { signAccessToken, signRefreshToken } = require("../src/utils/tokens");
const jwt = require("jsonwebtoken");

process.env.ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || "test_access_secret_123456789012";
process.env.REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || "test_refresh_secret_123456789012";

test("Auth: signupSchema rejects missing or invalid email", () => {
  const result = signupSchema.safeParse({
    body: {
      name: "Test User",
      email: "invalid-email",
      password: "password123",
    },
  });
  assert.strictEqual(result.success, false);
});

test("Auth: signupSchema rejects short password", () => {
  const result = signupSchema.safeParse({
    body: {
      name: "Test User",
      email: "valid@example.com",
      password: "short",
    },
  });
  assert.strictEqual(result.success, false);
});

test("Auth: signupSchema accepts valid registration payload", () => {
  const result = signupSchema.safeParse({
    body: {
      name: "Valid User",
      email: "user@example.com",
      password: "StrongPassword123",
    },
  });
  assert.strictEqual(result.success, true);
});

test("Auth: Tokens generation signs and embeds role claim", () => {
  const fakeUser = { _id: "6b0078526c9ed1884720ac49", role: "admin" };
  const accessToken = signAccessToken(fakeUser);
  const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);

  assert.strictEqual(decoded.userId, fakeUser._id);
  assert.strictEqual(decoded.role, "admin");
});
