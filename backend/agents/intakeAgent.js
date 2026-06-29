import IntakeCase from '../models/IntakeCase.js';
import { generateCaseId } from '../utils/generateCaseId.js';
import { classifyDocument } from '../utils/classifyDocument.js';
import supabase from '../config/supabase.js';
import { extractionAgent } from '../agents/extractionAgent.js'; // 👈 ADD THIS

export const intakeAgent = async (file) => {
    try {
        console.log('📥 INTAKE AGENT: Processing file...');
        
        const caseId = generateCaseId();
        console.log(`📋 Generated Case ID: ${caseId}`);

        // Classify using mimetype only
        const documentType = classifyDocument(file.mimetype, file.originalname);
        console.log(`📄 Document type: ${documentType}`);

        // Upload buffer to Supabase Storage
        const fileName = `${Date.now()}-${file.originalname}`;
        console.log(`📤 Uploading to Supabase: ${fileName}`);
        
        const { data, error } = await supabase.storage
            .from('documents')
            .upload(fileName, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            console.error('❌ Supabase upload error:', error.message);
            throw new Error('File upload to storage failed: ' + error.message);
        }

        // Get permanent public URL
        const { data: urlData } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);

        const fileUrl = urlData.publicUrl;
        console.log('✅ File uploaded to Supabase:', fileUrl);

        // ✅ Create the case in database
        console.log('💾 Saving case to database...');
        const intakeCase = await IntakeCase.create({
            caseId,
            documentType,
            source: fileUrl,
            originalFileName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            status: 'pending',
            currentAgent: "extraction",
            processingHistory: [
                {
                    agent: 'intake',
                    action: "case created",
                    timestamp: new Date(),
                }
            ]
        });

        console.log(`✅ Case saved with ID: ${intakeCase.caseId}`);

        // 🔥 CRITICAL FIX: Verify case exists in database
        const verifiedCase = await IntakeCase.findOne({ caseId: intakeCase.caseId });
        if (!verifiedCase) {
            throw new Error(`Case ${intakeCase.caseId} was not properly saved to database!`);
        }
        console.log(`✅ Case verified in database: ${verifiedCase.caseId}`);

        // ✅ FIX: Immediately trigger extraction after case is saved
        console.log(`🚀 Triggering extraction for case: ${caseId}`);
        
        try {
            // Call extraction agent directly
            const extractionResult = await extractionAgent(caseId);
            console.log(`✅ Extraction triggered successfully for: ${caseId}`);
            console.log(`   Word count: ${extractionResult.wordCount}`);
            console.log(`   Character count: ${extractionResult.characterCount}`);
            
            // Return the updated case with extraction data
            const updatedCase = await IntakeCase.findOne({ caseId });
            return updatedCase;
            
        } catch (extractionError) {
            console.error(`❌ Extraction failed for ${caseId}:`, extractionError.message);
            // Don't throw - return case without extraction
            // The case will be retried later
            console.log(`⚠️ Case ${caseId} created but extraction will need to be retried`);
            return intakeCase;
        }

    } catch (error) {
        console.error('❌ INTAKE AGENT ERROR:', error.message);
        console.error('Stack:', error.stack);
        throw error;
    }
};