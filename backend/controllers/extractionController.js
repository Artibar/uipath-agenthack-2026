
import IntakeCase from "../models/IntakeCase.js";
import { extractionAgent } from "../agents/extractionAgent.js";


export const runExtraction = async (req, res) => {
  try {
     console.log("PARAMS:", req.params);
    console.log("CASE ID RECEIVED:", req.params.caseId);

   
    const { caseId } = req.params;
 
    const result = await extractionAgent(caseId);
    const extractedText = result.extractedText;

    const updatedCase = await IntakeCase.findOneAndUpdate(
      { caseId },
      {
        extractedText: extractedText,  // ✅ Stored once
        status: "extracted",
        currentAgent: "compliance"  // Next agent
      },
      { new: true }
    );

    if (!updatedCase) {
      return res.status(404).json({
        success: false,
        message: "Case not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: updatedCase
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};