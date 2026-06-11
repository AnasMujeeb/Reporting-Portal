import mongoose from "mongoose";

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
      enum: ["Pending", "Under Review", "Resolved"],
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
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ComplaintSchema.index({ userId: 1, createdAt: -1 });
ComplaintSchema.index({ category: 1, status: 1 });

// Delete cached model in development so schema changes are picked up on hot-reload
if (mongoose.models.Complaint) {
  delete mongoose.models.Complaint;
}

export default mongoose.model("Complaint", ComplaintSchema);
