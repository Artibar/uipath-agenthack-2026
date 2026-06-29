import IntakeCase from "../models/IntakeCase.js";
import { extractionAgent } from "../agents/extractionAgent.js";

export const runExtraction = async (req, res) => {
  try {
    console.log("PARAMS:", req.params);
    console.log("CASE ID RECEIVED:", req.params.caseId);

    const { caseId } = req.params;
    
    // Validate caseId
    if (!caseId) {
      return res.status(400).json({
        success: false,
        message: "Case ID is required"
      });
    }

    // First check if case exists before running extraction
    const existingCase = await IntakeCase.findOne({ caseId });
    if (!existingCase) {
      console.error(`❌ Case not found: ${caseId}`);
      return res.status(404).json({
        success: false,
        message: `Case with ID ${caseId} not found`
      });
    }

    console.log(`✅ Case found: ${caseId}, current status: ${existingCase.status}`);

    // Run extraction with retry logic
    let result;
    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        result = await extractionAgent(caseId);
        break;
      } catch (error) {
        lastError = error;
        console.log(`⏳ Extraction attempt failed, retries left: ${retries - 1}`);
        console.log(`  Error: ${error.message}`);
        
        // If it's a "Case not found" error, wait and retry
        if (error.message.includes('Case not found')) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        retries--;
      }
    }

    if (!result) {
      throw new Error(`Extraction failed after retries: ${lastError?.message || 'Unknown error'}`);
    }

    // Update the case with extracted text
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
            action: "completed_successfully",
            timestamp: new Date(),
            metadata: {
              extractionType: result.extractionType || 'unknown',
              wordCount: result.wordCount || 0,
              characterCount: result.characterCount || 0
            }
          }
        }
      },
      { new: true }
    );

    if (!updatedCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found during update"
      });
    }

    console.log(`✅ Extraction completed successfully for case: ${caseId}`);

    return res.status(200).json({
      success: true,
      message: "Extraction completed successfully",
      data: updatedCase,
      extractionSummary: {
        wordCount: result.wordCount || 0,
        characterCount: result.characterCount || 0,
        extractionType: result.extractionType || 'unknown'
      }
    });

  } catch (error) {
    console.error('❌ EXTRACTION CONTROLLER ERROR:', error.message);
    console.error('  Stack:', error.stack);
    
    return res.status(500).json({
      success: false,
      message: error.message || "Extraction failed",
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};