import IntakeCase from "../models/IntakeCase.js";
import { extractionAgent } from "../agents/extractionAgent.js";

export const runExtraction = async (req, res) => {
    try {
        console.log("📥 EXTRACTION REQUEST RECEIVED");
        console.log("PARAMS:", req.params);
        
        const { caseId } = req.params;
        
        if (!caseId) {
            return res.status(400).json({
                success: false,
                message: "Case ID is required"
            });
        }

        console.log(`🔍 Looking for case: ${caseId}`);
        
        // ✅ Find the case with retry logic
        let existingCase = null;
        let attempts = 0;
        const maxAttempts = 5;
        
        while (attempts < maxAttempts && !existingCase) {
            existingCase = await IntakeCase.findOne({ caseId });
            if (!existingCase) {
                console.log(`⏳ Case not found, attempt ${attempts + 1}/${maxAttempts}`);
                await new Promise(resolve => setTimeout(resolve, 500));
                attempts++;
            }
        }

        if (!existingCase) {
            console.error(`❌ Case not found: ${caseId}`);
            
            // Debug: Show recent cases
            const recentCases = await IntakeCase.find({})
                .limit(5)
                .sort({ createdAt: -1 })
                .select('caseId status');
            
            console.log('📊 Recent cases:');
            recentCases.forEach(c => console.log(`  - ${c.caseId} (${c.status})`));
            
            return res.status(404).json({
                success: false,
                message: `Case ${caseId} not found`,
                debug: {
                    recentCases: recentCases.map(c => c.caseId),
                    totalCases: await IntakeCase.countDocuments()
                }
            });
        }

        // ✅ Check if already extracted
        if (existingCase.status === 'extracted' && existingCase.extractedText) {
            console.log(`✅ Case ${caseId} already extracted`);
            return res.status(200).json({
                success: true,
                message: "Case already extracted",
                data: existingCase
            });
        }

        console.log(`✅ Case found: ${existingCase.caseId}`);
        console.log(`   Status: ${existingCase.status}`);
        console.log(`   Document: ${existingCase.originalFileName}`);

        // Update status
        existingCase.status = 'processing';
        existingCase.currentAgent = 'extraction';
        existingCase.processingHistory.push({
            agent: "extraction",
            action: "started",
            timestamp: new Date()
        });
        await existingCase.save();

        // Run extraction
        console.log('🚀 Running extraction agent...');
        const result = await extractionAgent(caseId);

        // Update with extracted data
        const updatedCase = await IntakeCase.findOneAndUpdate(
            { caseId },
            {
                extractedText: result.extractedText || result.text || '',
                status: "extracted",
                currentAgent: "compliance",
                wordCount: result.wordCount || 0,
                characterCount: result.characterCount || 0,
                $push: {
                    processingHistory: {
                        agent: "extraction",
                        action: "completed",
                        timestamp: new Date(),
                        metadata: {
                            wordCount: result.wordCount || 0,
                            characterCount: result.characterCount || 0
                        }
                    }
                }
            },
            { new: true }
        );

        console.log(`✅ Extraction complete for: ${caseId}`);
        console.log(`   Word count: ${updatedCase.wordCount}`);
        console.log(`   Character count: ${updatedCase.characterCount}`);

        return res.status(200).json({
            success: true,
            message: "Extraction completed successfully",
            data: updatedCase
        });

    } catch (error) {
        console.error('❌ EXTRACTION CONTROLLER ERROR:', error.message);
        console.error('Stack:', error.stack);
        
        return res.status(500).json({
            success: false,
            message: error.message || "Extraction failed"
        });
    }
};