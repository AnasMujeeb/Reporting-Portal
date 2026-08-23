import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import connectDB from "@/lib/mongodb";
import Complaint from "@/models/Complaint";
import { authOptions } from "@/lib/auth";
import { getRiskDetails } from "@/lib/riskMatrix";

export async function POST(request, { params }) {
  try {
    
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can submit reviews" },
        { status: 403 }
      );
    }

    const { id } = await params;

    const body = await request.json();
    const {
      initialProbability,
      initialSeverity,
      finalProbability,
      finalSeverity,
      initialCorrectiveAction,
      rootCauseAnalysis,
      preventiveAction,
      remarks,
    } = body;

    
    const initialRisk = getRiskDetails(initialProbability, initialSeverity);

    if (!initialRisk) {
      return NextResponse.json(
        {
          error:
            "Invalid initial risk assessment. Probability must be 1-5 and Severity must be A-E.",
        },
        { status: 400 }
      );
    }

    
    const finalRisk = getRiskDetails(finalProbability, finalSeverity);

    if (!finalRisk) {
      return NextResponse.json(
        {
          error:
            "Invalid final risk assessment. Probability must be 1-5 and Severity must be A-E.",
        },
        { status: 400 }
      );
    }

    
    if (initialRisk.riskLevel !== "Green") {
      const missing = [];
      if (!initialCorrectiveAction?.trim())
        missing.push("initialCorrectiveAction");
      if (!rootCauseAnalysis?.trim()) missing.push("rootCauseAnalysis");
      if (!preventiveAction?.trim()) missing.push("preventiveAction");

      if (missing.length > 0) {
        return NextResponse.json(
          {
            error: `The following fields are required when initial risk is not Green: ${missing.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    
    await connectDB();

    const report = await Complaint.findById(id);

    if (!report) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      );
    }

    
    const actionPlanEntry = {
      adminId: session.user.id,
      reviewDate: new Date(),
      
      initialProbability: Number(initialProbability),
      initialSeverity: String(initialSeverity).toUpperCase(),
      initialMatrixCode: initialRisk.matrixCode,
      initialRiskLevel: initialRisk.riskLevel,
      
      finalProbability: Number(finalProbability),
      finalSeverity: String(finalSeverity).toUpperCase(),
      finalMatrixCode: finalRisk.matrixCode,
      finalRiskLevelAfterAction: finalRisk.riskLevel,
    };

    
    if (initialRisk.riskLevel !== "Green") {
      actionPlanEntry.initialCorrectiveAction = initialCorrectiveAction.trim();
      actionPlanEntry.rootCauseAnalysis = rootCauseAnalysis.trim();
      actionPlanEntry.preventiveAction = preventiveAction.trim();
    } else {
      
      if (remarks?.trim()) {
        actionPlanEntry.remarks = remarks.trim();
      }
      
      if (initialCorrectiveAction?.trim()) {
        actionPlanEntry.initialCorrectiveAction =
          initialCorrectiveAction.trim();
      }
      if (rootCauseAnalysis?.trim()) {
        actionPlanEntry.rootCauseAnalysis = rootCauseAnalysis.trim();
      }
      if (preventiveAction?.trim()) {
        actionPlanEntry.preventiveAction = preventiveAction.trim();
      }
    }

    
    report.actionPlanHistory.push(actionPlanEntry);

    
    report.currentRiskLevel = finalRisk.riskLevel;

    
    if (finalRisk.riskLevel === "Green") {
      
      report.status = "Closed";
      report.requiresActionPlan = false;
    } else {
      
      report.status = "In Progress";
      report.requiresActionPlan = true;
    }

    await report.save();

    
    const updatedReport = await Complaint.findById(id)
      .populate("userId", "name email")
      .populate("actionPlanHistory.adminId", "name email")
      .lean();

    return NextResponse.json({
      success: true,
      message:
        finalRisk.riskLevel === "Green"
          ? `Review submitted — report closed (risk mitigated to Green, ${finalRisk.matrixCode})`
          : `Review submitted — report remains In Progress (risk: ${finalRisk.riskLevel}, ${finalRisk.matrixCode})`,
      report: updatedReport,
    });
  } catch (error) {
    console.error("POST admin-review error:", error);

    
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json(
        { error: "Validation failed", details: messages },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
