import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { uploadDocument, getCase } from '../controllers/intakeController.js';

const router = express.Router();

console.log('✅ Intake routes loaded');

// Upload document route
router.post('/upload', upload, async (req, res) => {
  try {
    console.log('📥 Upload endpoint hit');
    console.log(
      '📁 File received:',
      req.file ? req.file.originalname : 'no file'
    );

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Document file required',
      });
    }

    await uploadDocument(req, res);
  } catch (err) {
    console.error('❌ Upload error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to process document upload',
    });
  }
});

// Optional case lookup route (only if your controller has getCase)
router.get('/case/:caseId', getCase);

export default router;