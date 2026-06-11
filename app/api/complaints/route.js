import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Complaint from "@/models/Complaint";
import { authOptions } from "@/lib/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    let query = {};

    if (session.user.role === "admin") {
      // Admin: get all complaints, with optional category filter
      const category = searchParams.get("category");
      if (category && category !== "all") {
        query.category = category;
      }

      const complaints = await Complaint.find(query)
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({ complaints });
    } else {
      // Employee: get only their own complaints
      query.userId = session.user.id;

      const complaints = await Complaint.find(query)
        .sort({ createdAt: -1 })
        .lean();

      return NextResponse.json({ complaints });
    }
  } catch (error) {
    console.error("GET complaints error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "employee") {
      return NextResponse.json(
        { error: "Only employees can submit reports" },
        { status: 403 }
      );
    }

    const { title, category, location, description, imageUrl } =
      await request.json();

    if (!title || !category || !location || !description) {
      return NextResponse.json(
        { error: "Please fill in all required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    const complaint = await Complaint.create({
      userId: session.user.id,
      title,
      category,
      location,
      description,
      imageUrl: imageUrl || null,
    });

    return NextResponse.json(
      { message: "Report submitted successfully", complaint },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST complaint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
