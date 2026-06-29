import express from 'express';
import IntakeCase from '../models/IntakeCase.js';

const router = express.Router();

// Check if a case exists
router.get('/check-case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    const caseData = await IntakeCase.findOne({ caseId });
    
    if (!caseData) {
      const recentCases = await IntakeCase.find({}).limit(10).sort({ createdAt: -1 });
      return res.json({
        exists: false,
        message: `Case ${caseId} not found`,
        recentCases: recentCases.map(c => c.caseId)
      });
    }
    
    res.json({
      exists: true,
      case: {
        caseId: caseData.caseId,
        status: caseData.status,
        documentType: caseData.documentType,
        hasExtractedText: !!caseData.extractedText,
        createdAt: caseData.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Force create a case for testing
router.post('/force-create', async (req, res) => {
  try {
    const { caseId, documentUrl } = req.body;
    
    const newCase = new IntakeCase({
      caseId: caseId || `CASE-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      status: "pending",
      currentAgent: "intake",
      documentType: "docx",
      source: documentUrl || "https://example.com/document.docx",
      originalFileName: "Document.docx",
      processingHistory: [{
        agent: "debug",
        action: "force_created",
        timestamp: new Date()
      }]
    });
    
    await newCase.save();
    
    res.json({
      success: true,
      message: "Case force created",
      caseId: newCase.caseId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;