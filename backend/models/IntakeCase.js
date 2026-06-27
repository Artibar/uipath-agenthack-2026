import mongoose from "mongoose";

const intakeCaseSchema = new mongoose.Schema({
  caseId: {
    type: String,
    required: true,
    unique: true,
  },
  documentType: {
    type: String,
    enum: ['pdf', 'docx', 'video', 'url'],
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  originalFileName: {
    type: String
  },
  mimeType: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "processing", "uploaded", "extracting", "extracted", "completed", "failed"],
    default: "pending",
  },
  extractedText: {
    type: String,
    default: ""
  },
  wordCount: {
    type: Number,
    default: 0,
  },
  characterCount: {
    type: Number,
    default: 0,
  },
  retrievedRegulations: [
    {
      title: String,
      content: String,
    }
  ],
  violations: [
    {
      rule: String,
      reason: String,
      severity: String
    }
  ],
  riskScore: {
    type: Number,
    default: 0
  },
  severity: {
    type: String,
    enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    default: "LOW"
  },
  report: {
    type: Object,
    default: {}
  },
  currentAgent: {
    type: String,
    default: "intake",
  },
  investigationType: {
    type: String,
    default: "compliance-review",
  },
  processingHistory: [
    {
      agent: String,
      action: String,
      timestamp: Date,
      metadata: mongoose.Schema.Types.Mixed,
    },
  ],

}, { timestamps: true }
)

const IntakeCase = mongoose.model('IntakeCase', intakeCaseSchema)
export default IntakeCase;