import IntakeCase from '../models/IntakeCase.js';
import {generateCaseId} from '../utils/generateCaseId.js';
import {classifyDocument} from '../utils/classifyDocument.js';

export const intakeAgent = async(file)=>{
   const caseId = generateCaseId();
   const documentType = classifyDocument(file.mimetype, file.path);
   const intakeCase = await IntakeCase.create({
    caseId,
    documentType,
    source: file.path,
    originalFileName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    currentAgent: "extraction",
    processingHistory:[
        {
            agent:'intake',
            action: "case created",
            timestamp: new Date(),
        }
    ]
   })
   return intakeCase;
}