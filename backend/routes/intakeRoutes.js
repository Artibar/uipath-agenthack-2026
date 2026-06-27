import express from 'express'
import {upload} from '../middleware/uploadMiddleware.js'
import {uploadDocument, getCase} from '../controllers/intakeController.js'

const router = express.Router()

console.log('✅ Routes loaded');

router.post('/upload', (req, res, next) => {
    console.log('📨 Content-Type:', req.headers['content-type']);
    console.log('📨 Body:', req.body ? Object.keys(req.body) : 'empty');  // ✅ FIXED
    next();
}, upload, uploadDocument)

router.get('/:caseId', getCase)

export default router