import IntakeCase from '../models/IntakeCase.js';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export const reCheckAgent = async(caseId, violationIndex, userId) => {
    let intakeCase;
    
    try {
        intakeCase = await IntakeCase.findOne({caseId});
        if(!intakeCase) throw new Error("Case not found");
        
        // ✅ Fix 1: complianceViolations → violations, Violations → violations
        if(!intakeCase.violations || intakeCase.violations.length === 0) {
            throw new Error("No violations found to recheck");
        }
        
        // ✅ Fix 2: Violations → violations
        const idx = parseInt(violationIndex);
        if(idx < 0 || idx >= intakeCase.violations.length) {
            throw new Error(`Violation index ${idx} not found`);
        }
        
        // ✅ Fix 3: complianceViolations → violations
        const violation = intakeCase.violations[idx];
        
        console.log('🔄 ReCheckAgent started...');
        console.log('  Violation Rule:', violation.rule);
        console.log('  Requested by:', userId);
        
        intakeCase.status = 'pending_recheck';
        await intakeCase.save();
        
        const reCheckPrompt = `
You are a compliance expert. Re-analyze this specific clause/rule from the document.

ORIGINAL VIOLATION:
Rule: ${violation.rule}
Severity: ${violation.severity}
Reason: ${violation.reason}

DOCUMENT EXCERPT:
${intakeCase.extractedText.substring(0, 2000)}

TASK:
1. Carefully re-read the document excerpt
2. Determine if this violation is CONFIRMED or should be OVERTURNED
3. Provide confidence score (0-100)
4. Explain your decision

Respond ONLY in JSON format:
{
  "isValid": boolean,
  "confidence": number,
  "explanation": string,
  "status": "confirmed" | "overturned"
}`;

        // ✅ Fix 4: groq.messages.create → groq.chat.completions.create (Groq SDK syntax)
        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",  // ✅ Fix 5: mixtral deprecated, use llama
            max_tokens: 500,
            messages: [{ role: "user", content: reCheckPrompt }]
        });

        let reCheckResult;
        try {
            // ✅ Fix 6: response.content → response.choices[0].message.content
            const resultText = response.choices[0].message.content;
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            reCheckResult = JSON.parse(jsonMatch ? jsonMatch[0] : resultText);
        } catch (e) {
            reCheckResult = {
                isValid: true,
                confidence: 75,
                explanation: "Original violation confirmed",
                status: "confirmed"
            };
        }

        console.log('✅ ReCheck Result:', reCheckResult.status, `(${reCheckResult.confidence}% confidence)`);
        
        // ✅ Fix 7: complianceViolations → violations (3 places)
        intakeCase.violations[idx] = {
            ...intakeCase.violations[idx].toObject(),  // ✅ Fix 8: toObject() for mongoose subdoc spread
            reChecked: true,
            reCheckResult: reCheckResult.status,
            reCheckConfidence: reCheckResult.confidence,
            reCheckedAt: new Date(),
            reCheckedBy: userId,
            explanation: reCheckResult.explanation
        };
        
        if (reCheckResult.status === 'overturned') {
            intakeCase.violations[idx].severity = 'RESOLVED';
        }

        // ✅ Fix 9: mark array as modified so mongoose saves it
        intakeCase.markModified('violations');
        
        intakeCase.status = 'rechecked';
        intakeCase.processingHistory.push({
            agent: 'recheck',
            action: 'violation_rechecked',
            timestamp: new Date(),
            metadata: {
                violationRule: violation.rule,
                result: reCheckResult.status,
                confidence: reCheckResult.confidence,
                requestedBy: userId
            }
        });
        
        await intakeCase.save();
        
        return {
            caseId,
            violationIndex: idx,
            originalViolation: violation.rule,
            reCheckResult: reCheckResult.status,
            confidence: reCheckResult.confidence,
            explanation: reCheckResult.explanation
        };
        
    } catch (error) {
        console.error('❌ RECHECK ERROR:', error.message);
        if(intakeCase) {
            intakeCase.status = 'recheck_failed';
            intakeCase.processingHistory.push({
                agent: 'recheck',
                action: 'failed',
                error: error.message,
                timestamp: new Date()
            });
            await intakeCase.save();
        }
        throw error;
    }
}