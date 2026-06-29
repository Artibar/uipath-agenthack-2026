export const extractionAgent = async (caseId) => {
    let intakeCase;
    try {
        console.log(`🔍 EXTRACTION AGENT: Looking for case ${caseId}`);
        
        // ✅ FIX: Add retry logic with proper error handling
        let attempts = 0;
        let maxAttempts = 5;
        let lastError = null;
        
        while (attempts < maxAttempts) {
            try {
                intakeCase = await IntakeCase.findOne({ caseId });
                if (intakeCase) {
                    console.log(`✅ Case found after ${attempts + 1} attempt(s)`);
                    break;
                }
                console.log(`⏳ Case not found, attempt ${attempts + 1}/${maxAttempts}`);
                attempts++;
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            } catch (error) {
                lastError = error;
                attempts++;
                console.log(`⚠️ Attempt ${attempts} failed: ${error.message}`);
            }
        }
        
        if (!intakeCase) {
            throw new Error(`Case ${caseId} not found after ${maxAttempts} attempts. Last error: ${lastError?.message || 'Unknown'}`);
        }
        
        console.log(`📖 Extraction starting for case: ${caseId}`);
        console.log(`   Document type: ${intakeCase.documentType}`);
        console.log(`   Source: ${intakeCase.source}`);
        
        // ... rest of your extraction logic remains the same
        // [Keep your existing extraction code here]
        
        // Update status
        intakeCase.status = 'extracting';
        await intakeCase.save();
        
        // ... extraction code ...
        
        return {
            caseId,
            extractedText: extractedText,
            wordCount,
            characterCount,
            nextAgent: "retrieval"
        };
        
    } catch (error) {
        console.error('❌ EXTRACTION AGENT ERROR:', error.message);
        
        if (intakeCase) {
            intakeCase.status = "failed";
            intakeCase.processingHistory.push({
                agent: "extraction",
                action: "failed",
                error: error.message,
                timestamp: new Date()
            });
            await intakeCase.save();
        }
        throw error;
    }
};