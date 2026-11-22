const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const User = require("../models/User");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const Order = require("../models/Order");

const demoProducts = [
  // Casual Category
  {
    name: "Classic Heavyweight Cotton T-Shirt",
    description: "Premium 240 GSM organic cotton t-shirt designed for everyday comfort and a relaxed, durable fit.",
    category: "casual",
    price: 35000, // 350.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800" },
      { url: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800" },
    ],
    variants: [
      { size: "S", stock: 15 },
      { size: "M", stock: 25 },
      { size: "L", stock: 20 },
      { size: "XL", stock: 10 },
    ],
    salesCount: 42,
  },
  {
    name: "Slim-Fit Selvedge Denim Jeans",
    description: "Authentic indigo-dyed selvedge denim jeans featuring custom brass hardware and a modern tailored taper.",
    category: "casual",
    price: 85000, // 850.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800" },
    ],
    variants: [
      { size: "S", stock: 8 },
      { size: "M", stock: 18 },
      { size: "L", stock: 14 },
      { size: "XL", stock: 6 },
    ],
    salesCount: 30,
  },
  {
    name: "Oversized Fleece Crewneck",
    description: "Cozy brushed fleece sweatshirt with drop shoulders and ribbed trims. Perfect for effortless casual layering.",
    category: "casual",
    price: 65000, // 650.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800" },
    ],
    variants: [
      { size: "M", stock: 12 },
      { size: "L", stock: 15 },
      { size: "XL", stock: 8 },
    ],
    salesCount: 22,
  },
  {
    name: "Canvas Chore Jacket",
    description: "Sturdy duck canvas workwear jacket with multiple patch pockets and reinforced button closures.",
    category: "casual",
    price: 99000, // 990.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800" },
    ],
    variants: [
      { size: "S", stock: 5 },
      { size: "M", stock: 10 },
      { size: "L", stock: 12 },
      { size: "XL", stock: 4 },
    ],
    salesCount: 15,
  },

  // Formal Category
  {
    name: "Tailored Italian Wool Suit Blazer",
    description: "Precision-cut single-breasted blazer woven from fine Italian wool with notch lapels and natural horn buttons.",
    category: "formal",
    price: 245000, // 2,450.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800" },
    ],
    variants: [
      { size: "M", stock: 6 },
      { size: "L", stock: 8 },
      { size: "XL", stock: 5 },
    ],
    salesCount: 18,
  },
  {
    name: "Crisp Oxford Button-Down Shirt",
    description: "Timeless 100% long-staple cotton Oxford cloth shirt with button-down collar and mother-of-pearl buttons.",
    category: "formal",
    price: 55000, // 550.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800" },
    ],
    variants: [
      { size: "S", stock: 10 },
      { size: "M", stock: 20 },
      { size: "L", stock: 15 },
      { size: "XL", stock: 7 },
    ],
    salesCount: 35,
  },
  {
    name: "Pleated Wool Dress Trousers",
    description: "High-waisted tailored dress trousers with subtle double pleats, side adjusters, and a clean drape.",
    category: "formal",
    price: 110000, // 1,100.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800" },
    ],
    variants: [
      { size: "S", stock: 6 },
      { size: "M", stock: 12 },
      { size: "L", stock: 10 },
    ],
    salesCount: 12,
  },

  // Gym Category
  {
    name: "Seamless Performance Athletic Tee",
    description: "Engineered four-way stretch fabric with moisture-wicking technology and targeted breathability zones.",
    category: "gym",
    price: 42000, // 420.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800" },
    ],
    variants: [
      { size: "S", stock: 15 },
      { size: "M", stock: 30 },
      { size: "L", stock: 25 },
      { size: "XL", stock: 15 },
    ],
    salesCount: 65,
  },
  {
    name: "2-in-1 Compression Training Shorts",
    description: "Lightweight outer shell with an integrated supportive liner, zip card pocket, and towel loop.",
    category: "gym",
    price: 49000, // 490.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800" },
    ],
    variants: [
      { size: "S", stock: 10 },
      { size: "M", stock: 20 },
      { size: "L", stock: 18 },
      { size: "XL", stock: 8 },
    ],
    salesCount: 52,
  },
  {
    name: "Thermal Compression Long Sleeve",
    description: "Snug compression fit that locks in muscle warmth during outdoor training and intense lifting sessions.",
    category: "gym",
    price: 52000, // 520.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1571731956672-f2b94d7dd0cb?w=800" },
    ],
    variants: [
      { size: "M", stock: 14 },
      { size: "L", stock: 16 },
      { size: "XL", stock: 9 },
    ],
    salesCount: 28,
  },

  // Party Category
  {
    name: "Velvet Peak Lapel Dinner Jacket",
    description: "Lustrous midnight-black cotton velvet tuxedo jacket featuring silk satin peak lapels and welt pockets.",
    category: "party",
    price: 280000, // 2,800.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800" },
    ],
    variants: [
      { size: "M", stock: 5 },
      { size: "L", stock: 7 },
      { size: "XL", stock: 3 },
    ],
    salesCount: 14,
  },
  {
    name: "Silk Camp Collar Resort Shirt",
    description: "Flowy, lightweight pure silk short-sleeve shirt with an abstract geometric print and relaxed boxy drape.",
    category: "party",
    price: 78000, // 780.00 EGP
    images: [
      { url: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800" },
    ],
    variants: [
      { size: "S", stock: 8 },
      { size: "M", stock: 15 },
      { size: "L", stock: 12 },
    ],
    salesCount: 20,
  },
];

const seedDatabase = async () => {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");

    // 1. Seed or Update Admin User
    const adminEmail = "admin@store.com";
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = new User({
        name: "Store Administrator",
        email: adminEmail,
        role: "admin",
      });
      await admin.setPassword("Admin123456!");
      await admin.save();
      console.log(`Created admin account: ${adminEmail} (password: Admin123456!)`);
    } else {
      admin.role = "admin";
      await admin.setPassword("Admin123456!");
      await admin.save();
      console.log(`Updated admin account: ${adminEmail} (password: Admin123456!)`);
    }

    // 2. Seed Products (upsert based on name)
    console.log("Seeding products...");
    let createdCount = 0;
    let updatedCount = 0;

    for (const prodData of demoProducts) {
      const existing = await Product.findOne({ name: prodData.name });
      if (existing) {
        Object.assign(existing, prodData);
        await existing.save();
        updatedCount++;
      } else {
        const product = new Product(prodData);
        await product.save();
        createdCount++;
      }
    }

    console.log(`Products seeded: ${createdCount} created, ${updatedCount} updated.`);
    console.log("Seeding finished successfully!");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
};

seedDatabase();
