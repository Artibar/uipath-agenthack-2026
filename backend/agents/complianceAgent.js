import IntakeCase from "../models/IntakeCase.js";
import groq from "../services/groqService.js";

export const complianceAgent = async (caseId) => {
  const intakeCase = await IntakeCase.findOne({ caseId });

  if (!intakeCase) {
    throw new Error("Case not found");
  }

  const prompt = `You are a compliance auditor. Analyze the document strictly against regulations.

Extracted Content:
${intakeCase.extractedText || "No content"}

Regulations:
${intakeCase.retrievedRegulations?.length > 0 
  ? JSON.stringify(intakeCase.retrievedRegulations) 
  : "No regulations available"}

CRITICAL: Return ONLY valid JSON, nothing else. No text before or after.
{
  "violations": [
    {
      "rule": "regulation name",
      "reason": "why it violates",
      "severity": "LOW|MEDIUM|HIGH|CRITICAL"
    }
  ]
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
  
  console.log("🔍 RAW COMPLIANCE RESPONSE:", raw);

  // Extract JSON from response (handles text before/after)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  
  if (!jsonMatch) {
    console.error("❌ NO JSON FOUND IN:", raw);
    // Return empty violations instead of crashing
    intakeCase.complianceViolations = [];  // ✅ CHANGED
    intakeCase.status = "checked";  // ✅ ADDED
    intakeCase.currentAgent = "risk";  // ✅ CHANGED (next agent)
    await intakeCase.save();
    return [];
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error("❌ JSON PARSE ERROR:", parseError.message);
    console.error("Attempted to parse:", jsonMatch[0]);
    intakeCase.complianceViolations = [];  // ✅ CHANGED
    intakeCase.status = "checked";  // ✅ ADDED
    intakeCase.currentAgent = "risk";  // ✅ CHANGED
    await intakeCase.save();
    return [];
  }

  // ✅ CHANGED: violations → complianceViolations
  intakeCase.complianceViolations = parsed.violations || [];
  intakeCase.status = "checked";  // ✅ ADDED
  intakeCase.currentAgent = "risk";  // ✅ CHANGED
  intakeCase.processingHistory.push({
    agent: "compliance",
    action: "completed",
    timestamp: new Date(),
    metadata: { violationCount: intakeCase.complianceViolations.length }  // ✅ ADDED
  });

  await intakeCase.save();

  console.log("✅ VIOLATIONS FOUND:", intakeCase.complianceViolations.length);  
  
  return intakeCase.complianceViolations; 
};