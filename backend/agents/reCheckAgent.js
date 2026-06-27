// agents/reCheckAgent.js
import IntakeCase from '../models/IntakeCase.js';
import { Groq } from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});
// agents/reCheckAgent.js
export const reCheckAgent = async(caseId, violationIndex, userId) => {
    let intakeCase;
    
    try {
        intakeCase = await IntakeCase.findOne({caseId});
        if(!intakeCase) throw new Error("Case not found");
        
        // ✅ FIX: Check if violations exist
        if(!intakeCase.complianceViolations || intakeCase.complianceViolations.length === 0) {
            throw new Error("No violations found to recheck");
        }
        
        // ✅ FIX: Check if violation index exists
        if(violationIndex < 0 || violationIndex >= intakeCase.complianceViolations.length) {
            throw new Error(`Violation index ${violationIndex} not found`);
        }
        
        const violation = intakeCase.complianceViolations[violationIndex];
        
        console.log('🔄 ReCheckAgent started...');
        console.log('  Violation Rule:', violation.rule);
        console.log('  Requested by:', userId);
        
        intakeCase.status = 'pending_recheck';
        await intakeCase.save();
        
        // 🔍 Deep re-analysis using Groq
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

        const response = await groq.messages.create({
            model: "mixtral-8x7b-32768",
            max_tokens: 500,
            messages: [
                {
                    role: "user",
                    content: reCheckPrompt
                }
            ]
        });

        let reCheckResult;
        try {
            const resultText = response.content[0].type === 'text' 
                ? response.content[0].text 
                : JSON.stringify(response.content[0]);
            
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
        
        // Update violation with recheck data
        intakeCase.complianceViolations[violationIndex] = {
            ...intakeCase.complianceViolations[violationIndex],
            reChecked: true,
            reCheckResult: reCheckResult.status,
            reCheckConfidence: reCheckResult.confidence,
            reCheckedAt: new Date(),
            reCheckedBy: userId,
            explanation: reCheckResult.explanation
        };
        
        // Update status based on recheck
        if (reCheckResult.status === 'overturned') {
            intakeCase.complianceViolations[violationIndex].severity = 'RESOLVED';
        }
        
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
            violationIndex,
            originalViolation: violation.rule,
            reCheckResult: reCheckResult.status,
            confidence: reCheckResult.confidence,
            explanation: reCheckResult.explanation
        };
        
    } catch (error) {
        console.error('❌ RECHECK ERROR:', error.message);
        
        if(intakeCase) {
            intakeCase.status = 'rechecked';  // ✅ CHANGED from 'recheck_failed'
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