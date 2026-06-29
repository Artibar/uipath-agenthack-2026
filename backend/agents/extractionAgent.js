import IntakeCase from '../models/IntakeCase.js';
import { extractPdfText } from '../services/pdfService.js';
import { extractDocxText } from '../services/docxService.js';
import { extractVideoText } from '../services/videoService.js';
import { extractedUrlText } from '../services/urlService.js';
import fs from 'fs';
import path from 'path';

export const extractionAgent = async (caseId) => {
    let intakeCase;
    try {
        console.log(`🔍 Looking for case: ${caseId}`);
        
        // Try to find the case with retry logic for race conditions
        let attempts = 0;
        while (attempts < 5) {
            intakeCase = await IntakeCase.findOne({ caseId });
            if (intakeCase) break;
            console.log(`⏳ Case ${caseId} not found, waiting... (attempt ${attempts + 1}/5)`);
            await new Promise(resolve => setTimeout(resolve, 300));
            attempts++;
        }

        if (!intakeCase) {
            console.error(`❌ Case not found: ${caseId}`);
            throw new Error(`Case not found: ${caseId}`);
        }

        console.log(`✅ Case found: ${caseId}`);
        console.log('📖 Extraction starting...');
        console.log('  Document Type:', intakeCase.documentType);
        console.log('  Source:', intakeCase.source);
        console.log("Remote source URL:", intakeCase.source);
        console.log("Case Status:", intakeCase.status);

        // Update status to extracting
        intakeCase.status = 'extracting';
        intakeCase.processingHistory.push({
            agent: "extraction",
            action: "started",
            timestamp: new Date(),
            metadata: {
                documentType: intakeCase.documentType,
                source: intakeCase.source
            }
        });
        await intakeCase.save();

        // Determine document type from file extension if not set correctly
        let docType = intakeCase.documentType;
        if (!docType || docType === 'document' || docType === 'unknown') {
            const source = intakeCase.source || '';
            const ext = path.extname(source).toLowerCase().substring(1);
            // Map extensions to document types
            if (ext === 'pdf') docType = 'pdf';
            else if (ext === 'docx' || ext === 'doc') docType = 'docx';
            else if (ext === 'mp4' || ext === 'mov' || ext === 'avi') docType = 'video';
            else if (source.startsWith('http://') || source.startsWith('https://')) docType = 'url';
            else docType = 'pdf'; // default fallback
            console.log('  ℹ️ Document type corrected to:', docType);
        }

        // Define extractors with better error handling
        const extractors = {
            pdf: async (source) => {
                console.log('  🔍 Extracting PDF from:', source);
                try {
                    const result = await extractPdfText(source);
                    return result.text || result || '';
                } catch (error) {
                    console.error('  ❌ PDF extraction error:', error.message);
                    throw new Error(`PDF extraction failed: ${error.message}`);
                }
            },
            docx: async (source) => {
                console.log('  🔍 Extracting DOCX from:', source);
                try {
                    const result = await extractDocxText(source);
                    return result.text || result || '';
                } catch (error) {
                    console.error('  ❌ DOCX extraction error:', error.message);
                    throw new Error(`DOCX extraction failed: ${error.message}`);
                }
            },
            video: async (source) => {
                console.log('  🔍 Extracting Video from:', source);
                try {
                    const result = await extractVideoText(source);
                    return result.text || result || '';
                } catch (error) {
                    console.error('  ❌ Video extraction error:', error.message);
                    throw new Error(`Video extraction failed: ${error.message}`);
                }
            },
            url: async (source) => {
                console.log('  🔍 Extracting URL from:', source);
                try {
                    const result = await extractedUrlText(source);
                    return result.text || result || '';
                } catch (error) {
                    console.error('  ❌ URL extraction error:', error.message);
                    throw new Error(`URL extraction failed: ${error.message}`);
                }
            },
        };

        const extractor = extractors[docType];
        if (!extractor) {
            throw new Error(
                `Unsupported document type: ${docType}. Supported: pdf, docx, video, url`
            );
        }

        // Extract text with timeout
        console.log(`⏳ Starting extraction for ${docType}...`);
        let extractedText = await Promise.race([
            extractor(intakeCase.source),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Extraction timeout after 60 seconds')), 60000)
            )
        ]);

        // Debug extraction result
        console.log('📝 Extracted text length:', extractedText?.length || 0);
        console.log('📝 Extracted text preview:', extractedText?.substring(0, 200) || 'EMPTY');

        if (!extractedText || extractedText.trim().length === 0) {
            throw new Error('Extraction returned empty text — document may be corrupted or unsupported');
        }

        // Ensure it's a string
        if (typeof extractedText !== 'string') {
            extractedText = JSON.stringify(extractedText);
        }

        console.log('  ✅ Extraction successful. Length:', extractedText.length);

        // Calculate metrics
        const wordCount = extractedText.trim().split(/\s+/).filter(w => w).length;
        const characterCount = extractedText.length;

        // Store full text in case
        intakeCase.extractedText = extractedText;
        intakeCase.wordCount = wordCount;
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
                documentType: docType,
                extractionTime: new Date().toISOString()
            }
        });
        await intakeCase.save();

        console.log('✅ EXTRACTION COMPLETE');

        // Return the full text or a truncated version based on needs
        return {
            caseId,
            extractionType: docType,
            wordCount,
            characterCount,
            text: extractedText, // Return full text for storage
            extractedText: extractedText, // Keep for compatibility
            nextAgent: "retrieval",
            status: "extracted"
        };

    } catch (error) {
        console.error('❌ EXTRACTION ERROR:', error.message);
        console.error('  Stack:', error.stack);

        // Update case with failure status if it exists
        if (intakeCase) {
            try {
                intakeCase.status = "failed";
                intakeCase.processingHistory.push({
                    agent: "extraction",
                    action: "failed",
                    error: error.message,
                    timestamp: new Date(),
                    metadata: {
                        documentType: intakeCase.documentType,
                        source: intakeCase.source
                    }
                });
                await intakeCase.save();
                console.log('✅ Case status updated to failed');
            } catch (updateError) {
                console.error('❌ Failed to update case status:', updateError.message);
            }
        }
        throw error;
    }
};