import IntakeCase from "../models/IntakeCase.js";
import groq from "../services/groqService.js";
import fs from "fs";

export const reportAgent = async (caseId) => {
  const intakeCase = await IntakeCase.findOne({ caseId });

  if (!intakeCase) {
    throw new Error("Case not found");
  }

  // ✅ CHANGED: violations → complianceViolations
  const violationsSummary = intakeCase.complianceViolations
    ?.map(v => `- ${v.rule} (${v.severity}): ${v.reason}`)
    .join("\n") || "No violations found";

  const regulationsSummary = intakeCase.retrievedRegulations
    ?.map(r => `- ${r.title}`)
    .join("\n") || "No regulations retrieved";

  const prompt = `You are a compliance report writer. Generate a professional summary.

Document Type: ${intakeCase.documentType || "Unknown"}
Extracted Text Length: ${intakeCase.extractedText?.length || 0} chars

Applicable Regulations:
${regulationsSummary}

Detected Violations:
${violationsSummary}

Generate a brief JSON report:
{
  "summary": "1-2 sentence overview",
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "recommendedActions": ["action1", "action2"],
  "nextSteps": "brief guidance"
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0
  });

  const raw = completion.choices[0].message.content;

  console.log("📄 RAW REPORT RESPONSE:", raw.substring(0, 100) + "...");

  // Extract JSON
  const jsonMatch = raw.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    console.error("❌ NO JSON IN REPORT:", raw);
    intakeCase.report = {
      summary: "Report generation failed",
      riskLevel: "UNKNOWN",
      recommendedActions: [],
      nextSteps: "Manual review required"
    };
    intakeCase.status = "completed";  // ✅ CHANGED
    intakeCase.riskLevel = "UNKNOWN";  // ✅ ADDED
    
    // ✅ DELETE FILE
    if (intakeCase.source && fs.existsSync(intakeCase.source)) {
      fs.unlinkSync(intakeCase.source);
      console.log('🗑️ File deleted:', intakeCase.source);
    }
    
    await intakeCase.save();
    return intakeCase.report;
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error("❌ REPORT JSON PARSE ERROR:", parseError.message);
    intakeCase.report = {
      summary: "Report generation failed",
      riskLevel: "UNKNOWN",
      recommendedActions: [],
      nextSteps: "Manual review required"
    };
    intakeCase.status = "completed";  // ✅ CHANGED
    intakeCase.riskLevel = "UNKNOWN";  // ✅ ADDED
    
    // ✅ DELETE FILE
    if (intakeCase.source && fs.existsSync(intakeCase.source)) {
      fs.unlinkSync(intakeCase.source);
      console.log('🗑️ File deleted:', intakeCase.source);
    }
    
    await intakeCase.save();
    return intakeCase.report;
  }

  intakeCase.report = parsed;
  intakeCase.riskLevel = parsed.riskLevel;  // ✅ ADDED
  intakeCase.status = "completed";
  intakeCase.currentAgent = "complete";
  intakeCase.processingHistory.push({
    agent: "report",
    action: "completed",
    timestamp: new Date(),
    metadata: { riskLevel: parsed.riskLevel, violationCount: intakeCase.complianceViolations?.length || 0 }  // ✅ ADDED
  });

  // ✅ DELETE FILE AFTER PROCESSING
  if (intakeCase.source && fs.existsSync(intakeCase.source)) {
    fs.unlinkSync(intakeCase.source);
    console.log('🗑️ File deleted:', intakeCase.source);
  }

  await intakeCase.save();

  console.log("✅ REPORT GENERATED - Risk Level:", parsed.riskLevel);

  return parsed;
};