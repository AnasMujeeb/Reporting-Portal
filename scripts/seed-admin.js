/**
 * Admin Seed Script
 * 
 * Creates an admin user in the MongoDB database.
 * Usage: node scripts/seed-admin.js
 * 
 * Make sure MONGODB_URI is set in your .env.local file before running.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const path = require("path");

// Load .env.local manually
const fs = require("fs");
const envPath = path.resolve(__dirname, "../.env.local");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found. Please set it in .env.local");
  process.exit(1);
}

// Define User schema inline (can't use ES module import in CJS script)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["admin", "employee"], default: "employee" },
}, { timestamps: true });

async function seedAdmin() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const User = mongoose.model("User", UserSchema);

    // Admin credentials — change these!
    const adminData = {
      name: "Admin User",
      email: "admin@staraviation.com",
      role: "admin",
    };

    const plainPassword = "admin123";

    // Check if admin already exists
    const existing = await User.findOne({ email: adminData.email });
    if (existing) {
      console.log(`⚠️  Admin already exists: ${adminData.email}`);
      console.log(`   Role: ${existing.role}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Create admin
    const admin = await User.create({
      ...adminData,
      password: hashedPassword,
    });

    console.log("\n✅ Admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`   Name:     ${admin.name}`);
    console.log(`   Email:    ${admin.email}`);
    console.log(`   Password: ${plainPassword}`);
    console.log(`   Role:     ${admin.role}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n⚠️  Change the password after first login!");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding admin:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedAdmin();
