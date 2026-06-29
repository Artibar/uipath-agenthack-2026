import express from 'express'
import {upload} from '../middleware/uploadMiddleware.js'
import {uploadDocument, getCase} from '../controllers/intakeController.js'

const router = express.Router()

console.log('✅ Routes loaded');

router.post('/upload', async (req, res, next) => {
  try {
    const { documentUrl, caseId } = req.body;
    if (!documentUrl) {
      return res.status(400).json({ success: false, message: 'documentUrl required' });
    }
    const response = await fetch(documentUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    req.file = {
      buffer,
      originalname: documentUrl.split('/').pop(),
      mimetype: response.headers.get('content-type') || 'application/octet-stream',
      size: buffer.length
    };
    req.body.caseId = caseId;
    next();
  } catch (err) {
    console.error('❌ URL fetch error:', err);
    res.status(400).json({ success: false, message: 'Failed to fetch document from URL' });
  }
}, uploadDocument);

export default router