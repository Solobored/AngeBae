import { NextRequest, NextResponse } from "next/server";
import { querySingle } from "@/lib/db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Fetch admin from PostgreSQL
    const admin = await querySingle(
      "SELECT id, email, password, name, active FROM admins WHERE email = $1",
      [email]
    );

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Check if admin is active
    if (!admin.active) {
      return NextResponse.json({ error: "Admin account is inactive" }, { status: 401 });
    }

    // Compare password
    const isValid = await bcrypt.compare(password, admin.password);

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { adminId: admin.id, email: admin.email },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "24h" }
    );

    // Remove password before returning
    const { password: _, ...adminInfo } = admin;

    // Set secure httpOnly cookie
    const response = NextResponse.json({ 
      admin: adminInfo,
      token 
    });
    
    response.cookies.set({
      name: "admin_auth",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 24 hours
    });

    return response;
  } catch (err) {
    console.error("Admin login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
