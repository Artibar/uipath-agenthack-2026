import IntakeCase from '../models/IntakeCase.js';
import { generateCaseId } from '../utils/generateCaseId.js';
import { classifyDocument } from '../utils/classifyDocument.js';
import supabase from '../config/supabase.js';

export const intakeAgent = async (file) => {
    const caseId = generateCaseId();

    // ✅ Classify using mimetype only (no file.path needed)
    const documentType = classifyDocument(file.mimetype, file.originalname);

    // ✅ Upload buffer to Supabase Storage
    const fileName = `${Date.now()}-${file.originalname}`;
    const { data, error } = await supabase.storage
        .from('documents')                          // your bucket name
        .upload(fileName, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });

    if (error) {
        console.error('❌ Supabase upload error:', error.message);
        throw new Error('File upload to storage failed: ' + error.message);
    }

    // ✅ Get permanent public URL
    const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;
    console.log('✅ File uploaded to Supabase:', fileUrl);

    // ✅ Store URL in DB (not local path)
    const intakeCase = await IntakeCase.create({
        caseId,
        documentType,
        source: fileUrl,          // ← permanent URL, not file.path
        originalFileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        currentAgent: "extraction",
        processingHistory: [
            {
                agent: 'intake',
                action: "case created",
                timestamp: new Date(),
            }
        ]
    });

    return intakeCase;
};