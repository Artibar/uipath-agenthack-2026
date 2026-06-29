import IntakeCase from '../models/IntakeCase.js'
import { extractPdfText } from '../services/pdfService.js'
import { extractDocxText } from '../services/docxService.js'
import { extractVideoText } from '../services/videoService.js'
import { extractedUrlText } from '../services/urlService.js'
import fs from 'fs'
import path from 'path'

export const extractionAgent = async (caseId) => {
    let intakeCase;
    try {
        intakeCase = await IntakeCase.findOne({ caseId })
        if (!intakeCase) {
            throw new Error("Case not found")
        }

        console.log('📖 Extraction starting...');
        console.log('  Document Type:', intakeCase.documentType);
        console.log('  Source:', intakeCase.source);
        console.log("Remote source URL:", intakeCase.source);

        intakeCase.status = 'extracting';
        intakeCase.processingHistory.push({
            agent: "extraction",
            action: "started",
            timestamp: new Date(),
        });
        await intakeCase.save()

        // Determine document type from file extension if not set correctly
        let docType = intakeCase.documentType;
        if (!docType || docType === 'document') {
            const ext = path.extname(intakeCase.source).toLowerCase().substring(1);
            docType = ext === 'pdf' ? 'pdf' : ext === 'docx' ? 'docx' : 'pdf';
            console.log('  ℹ️ Document type corrected:', docType);
        }

        const extractors = {
            pdf: async (source) => {
                console.log('  🔍 Extracting PDF from:', source);
                const result = await extractPdfText(source);
                return result.text || result;
            },
            docx: async (source) => {
                console.log('  🔍 Extracting DOCX from:', source);
                const result = await extractDocxText(source);
                return result.text || result;
            },
            video: async (source) => {
                console.log('  🔍 Extracting Video from:', source);
                const result = await extractVideoText(source);
                return result.text || result;
            },
            url: async (source) => {
                console.log('  🔍 Extracting URL from:', source);
                const result = await extractedUrlText(source);
                return result.text || result;
            },
        };

        const extractor = extractors[docType];
        if (!extractor) {
            throw new Error(
                `Unsupported document type: ${docType}. Supported: pdf, docx, video, url`
            )
        }

        // Extract text
        let extractedText = await extractor(intakeCase.source)

        // ✅ ADD THIS DEBUG
        console.log('📝 Extracted text length:', extractedText?.length);
        console.log('📝 Extracted text preview:', extractedText?.substring(0, 200));

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('Extraction returned empty text — document may be corrupted or unsupported');
        }


        // Ensure it's a string
        if (typeof extractedText !== 'string') {
            extractedText = JSON.stringify(extractedText);
        }

        console.log('  ✅ Extraction successful. Length:', extractedText.length);

        const wordCount = extractedText.trim().split(/\s+/).filter(w => w).length;
        const characterCount = extractedText.length;

        intakeCase.extractedText = extractedText
        intakeCase.wordCount = wordCount
        intakeCase.characterCount = characterCount;
        intakeCase.status = "extracted";
        intakeCase.currentAgent = "retrieval";
        intakeCase.processingHistory.push({
            agent: "extraction",
            action: "completed",
            timestamp: new Date(),
            metadata: {
                wordCount,
                characterCount,
                documentType: docType
            }
        });
        await intakeCase.save()

        console.log('✅ EXTRACTION COMPLETE');

        return {
            caseId,
            extractionType: docType,
            wordCount,
            characterCount,
            extractedText: extractedText.substring(0, 100) + '...', // Only return snippet
            nextAgent: "retrieval",
        }
    } catch (error) {
        console.error('❌ EXTRACTION ERROR:', error.message);
        console.error('  Stack:', error.stack);

        if (intakeCase) {
            intakeCase.status = "failed";
            intakeCase.processingHistory.push({
                agent: "extraction",
                action: "failed",
                error: error.message,
                timestamp: new Date()
            })
            await intakeCase.save()
        }
        throw error;
    }
}