const test = require("node:test");
const assert = require("node:assert");
const { createProductSchema } = require("../src/schemas/productSchema");
const Product = require("../src/models/Product");

test("Product: createProductSchema validates valid product", () => {
  const result = createProductSchema.safeParse({
    body: {
      name: "Classic Tee",
      description: "Organic cotton tee",
      price: 35000,
      category: "casual",
      variants: [{ size: "M", stock: 10 }],
    },
  });
  assert.strictEqual(result.success, true);
});

test("Product: createProductSchema rejects invalid category", () => {
  const result = createProductSchema.safeParse({
    body: {
      name: "Classic Tee",
      price: 35000,
      category: "unsupported_category",
    },
  });
  assert.strictEqual(result.success, false);
});

test("Product: SIZES export contains standard apparel sizes", () => {
  assert.ok(Product.SIZES.includes("S"));
  assert.ok(Product.SIZES.includes("M"));
  assert.ok(Product.SIZES.includes("L"));
  assert.ok(Product.SIZES.includes("XL"));
});
