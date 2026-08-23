import mongoose from "mongoose";


const ActionPlanEntrySchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Admin ID is required"],
    },
    reviewDate: {
      type: Date,
      default: Date.now,
    },

    
    initialProbability: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: [true, "Initial probability is required"],
    },
    initialSeverity: {
      type: String,
      enum: ["A", "B", "C", "D", "E"],
      required: [true, "Initial severity is required"],
    },
    initialMatrixCode: {
      type: String,
      trim: true,
      required: [true, "Initial matrix code is required"],
    },
    initialRiskLevel: {
      type: String,
      enum: {
        values: ["Green", "Yellow", "Red"],
        message: "{VALUE} is not a valid risk level",
      },
      required: [true, "Initial risk level is required"],
    },

    
    initialCorrectiveAction: {
      type: String,
      trim: true,
    },
    rootCauseAnalysis: {
      type: String,
      trim: true,
    },
    preventiveAction: {
      type: String,
      trim: true,
    },

    
    remarks: {
      type: String,
      trim: true,
    },

    
    finalProbability: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      required: [true, "Final probability is required"],
    },
    finalSeverity: {
      type: String,
      enum: ["A", "B", "C", "D", "E"],
      required: [true, "Final severity is required"],
    },
    finalMatrixCode: {
      type: String,
      trim: true,
      required: [true, "Final matrix code is required"],
    },
    finalRiskLevelAfterAction: {
      type: String,
      enum: {
        values: ["Green", "Yellow", "Red"],
        message: "{VALUE} is not a valid final risk level",
      },
      required: [true, "Final risk level after action is required"],
    },
  },
  { _id: true }
);

const ComplaintSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    title: {
      type: String,
      required: [true, "Please provide a report title"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    category: {
      type: String,
      required: [true, "Please select a category"],
      enum: {
        values: ["flight_ops", "ground_ops", "maintenance", "facilities"],
        message: "{VALUE} is not a valid category",
      },
    },
    location: {
      type: String,
      required: [true, "Please provide the location"],
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Closed"],
      default: "Pending",
    },
    imageUrl: {
      type: String,
      default: null,
    },
    probability: {
      type: Number,
      enum: [1, 2, 3, 4, 5],
      default: null,
    },
    severity: {
      type: String,
      enum: ["A", "B", "C", "D", "E"],
      default: null,
    },
    riskLevel: {
      type: String,
      enum: ["Red", "Orange", "Green"],
      default: null,
    },
    
    currentRiskLevel: {
      type: String,
      enum: {
        values: ["Green", "Yellow", "Red", "Not Assessed"],
        message: "{VALUE} is not a valid current risk level",
      },
      default: "Not Assessed",
    },
    actionPlanHistory: {
      type: [ActionPlanEntrySchema],
      default: [],
    },
    requiresActionPlan: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);


ComplaintSchema.index({ userId: 1, createdAt: -1 });
ComplaintSchema.index({ category: 1, status: 1 });


if (mongoose.models.Complaint) {
  delete mongoose.models.Complaint;
}

export default mongoose.model("Complaint", ComplaintSchema);
