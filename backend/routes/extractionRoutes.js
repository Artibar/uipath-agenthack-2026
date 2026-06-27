import express from 'express'
import {runExtraction} from '../controllers/extractionController.js'

const router = express.Router()

router.post('/:caseId', runExtraction)

export default router;