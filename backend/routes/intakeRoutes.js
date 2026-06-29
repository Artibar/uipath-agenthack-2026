import express from 'express'
import {upload} from '../middleware/uploadMiddleware.js'
import {uploadDocument, getCase} from '../controllers/intakeController.js'

const router = express.Router()

console.log('✅ Routes loaded');

router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    console.log('📥 Upload endpoint hit');
    console.log('📁 File received:', req.file ? req.file.originalname : 'no file');
    
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'Document file required' 
      });
    }
 
    // Pass to uploadDocument controller
    await uploadDocument(req, res);
  } catch (err) {
    console.error('❌ Upload error:', err.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process document upload' 
    });
  }
});
 

export default router