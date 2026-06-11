import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Complaint from "@/models/Complaint";
import { authOptions } from "@/lib/auth";
import { calculateRiskLevel } from "@/lib/riskMatrix";

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can update report status" },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    console.log("PATCH /api/complaints/[id] — Incoming body:", body);

    const { status, probability, severity } = body;

    // Build the $set update object
    const updateData = {};

    // Validate and apply status if provided
    if (status !== undefined) {
      const validStatuses = ["Pending", "Under Review", "Resolved"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status value" },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Validate and apply risk assessment if provided
    if (probability !== undefined && severity !== undefined) {
      const probNum = Number(probability);
      const sevStr = String(severity).toUpperCase();

      if (![1, 2, 3, 4, 5].includes(probNum)) {
        return NextResponse.json(
          { error: "Probability must be 1, 2, 3, 4, or 5" },
          { status: 400 }
        );
      }

      if (!["A", "B", "C", "D", "E"].includes(sevStr)) {
        return NextResponse.json(
          { error: "Severity must be A, B, C, D, or E" },
          { status: 400 }
        );
      }

      const riskLevel = calculateRiskLevel(probNum, sevStr);

      if (!riskLevel) {
        return NextResponse.json(
          { error: "Unable to calculate risk level from provided values" },
          { status: 400 }
        );
      }

      updateData.probability = probNum;
      updateData.severity = sevStr;
      updateData.riskLevel = riskLevel;
    }

    // Ensure there's something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    await connectDB();

    console.log("Writing to MongoDB with $set:", updateData);

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: "after", runValidators: true }
    ).populate("userId", "name email");

    if (!updatedComplaint) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    console.log("MongoDB write confirmed:", {
      _id: updatedComplaint._id,
      probability: updatedComplaint.probability,
      severity: updatedComplaint.severity,
      riskLevel: updatedComplaint.riskLevel,
      status: updatedComplaint.status,
    });

    return NextResponse.json({
      success: true,
      message: "Report updated successfully",
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("PATCH complaint error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
