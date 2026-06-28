import React, { useState } from 'react';
import axios from 'axios';

export default function ComplianceAnalyzer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [rechecking, setRechecking] = useState(null);

  const API_BASE_URL = 'https://uipath-agenthack-2026.onrender.com/api';

  // Valid file types for compliance documents
  const VALID_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      validateAndSetFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    // Check file type
    if (!VALID_FILE_TYPES.includes(selectedFile.type)) {
      setError('Invalid file type. Please upload PDF, DOC, DOCX, or TXT');
      setFile(null);
      return;
    }

    // Check file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      const fileSizeMB = (selectedFile.size / 1024 / 1024).toFixed(1);
      setError(`File too large. Max size: 25MB. Your file: ${fileSizeMB}MB`);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null); // Clear previous errors when file changes
  };

  const getRiskColor = (risk) => {
    const colors = {
      CRITICAL: '#DC2626',
      HIGH: '#EA580C',
      MEDIUM: '#F59E0B',
      LOW: '#10B981'
    };
    return colors[risk] || '#6B7280';
  };

  const getSeverityBadgeColor = (severity) => {
    const colors = {
      CRITICAL: 'bg-red-100 text-red-800 border-red-300',
      HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
      MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
      LOW: 'bg-green-100 text-green-800 border-green-300',
      RESOLVED: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const handleRecheck = async (violationIndex) => {
    try {
      setRechecking(violationIndex);
      const response = await axios.post(
        `${API_BASE_URL}/workflow/${result.caseId}/recheck/${violationIndex}`
      );
      console.log('✅ Recheck result:', response.data);

      const updatedViolations = result.violations.map((v, idx) => {
        if (idx === violationIndex) {
          return {
            ...v,
            reChecked: true,
            // ✅ Add safety checks with optional chaining for missing data
            reCheckResult: response.data?.data?.reCheckResult?.reCheckResult || 'unknown',
            reCheckConfidence: response.data?.data?.reCheckResult?.confidence || 0,
            explanation: response.data?.data?.reCheckResult?.explanation || 'No explanation provided'
          };
        }
        return v;
      });

      setResult(prev => ({ ...prev, violations: updatedViolations }));
      const status = response.data?.data?.reCheckResult?.status || 'Success';
      alert(`✅ Violation rechecked: ${status}`);
    } catch (err) {
      console.error('Recheck error:', err);
      alert('⚠️ Recheck failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setRechecking(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation checks
    if (!file) {
      setError("Please select a file");
      return;
    }

    // File type validation (double-check, though already validated on selection)
    if (!VALID_FILE_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, DOC, DOCX, or TXT');
      return;
    }

    // File size validation (double-check, though already validated on selection)
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      setError(`File too large. Max 25MB. Your file: ${fileSizeMB}MB`);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("document", file);

      // Step 1: Upload (intake)
      setLoadingStep('uploading');
      const uploadRes = await axios.post(`${API_BASE_URL}/intake/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const caseId = uploadRes.data.data.caseId;
      console.log('✅ Case created:', caseId);

      // Step 2: Trigger UiPath orchestration
      setLoadingStep('uipath');
      await axios.post(`${API_BASE_URL}/uipath/trigger/${caseId}`);
      console.log('✅ UiPath triggered');

      // Step 3: Poll until completed (increased timeout: 30 attempts × 4s = 120s max)
      setLoadingStep('polling');
      let finalCase = null;
      let attempts = 0;
      const maxAttempts = 30;

      while (attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 4000));
        const statusRes = await axios.get(`${API_BASE_URL}/workflow/${caseId}`);
        const status = statusRes.data.data.status;
        console.log(`⏳ Polling status: ${status} (attempt ${attempts + 1}/${maxAttempts})`);

        if (status === 'completed') {
          finalCase = statusRes.data.data;
          break;
        }
        attempts++;
      }

      if (!finalCase) {
        throw new Error(`Processing timed out after ${maxAttempts * 4}s. Try a smaller document or check backend logs.`);
      }

      setResult({
        caseId,
        violations: finalCase.violations || [],
        report: finalCase.report || {}
      });

      setFile(null);
    } catch (err) {
      console.error('Full error:', err);
      setError(err.response?.data?.message || err.message || "Processing failed. Check backend logs.");
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleReset = () => {
    setResult(null);
    setFile(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 shadow-sm z-10">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📋</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Compliance Analyzer</h1>
              <p className="text-sm text-slate-600">AI-powered document compliance assessment • Orchestrated by UiPath Maestro</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Upload Section */}
        {!result && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
            <form onSubmit={handleSubmit}>
              {/* Drag & Drop */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                }`}
              >
                <input
                  type="file"
                  onChange={handleFileSelect}
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-lg font-semibold text-slate-900 mb-2">
                    {file ? file.name : 'Drop your document here'}
                  </p>
                  <p className="text-sm text-slate-600">
                    {file ? 'Click to change' : 'or click to browse'}
                  </p>
                  <p className="text-xs text-slate-500 mt-4">
                    Supported: PDF, DOC, DOCX, TXT • Max size: 25MB • Vendor, Insurance, Loan documents
                  </p>
                </label>
              </div>

              {/* Error */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">⚠️ {error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  disabled={!file || loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? '⏳ Analyzing...' : '🔍 Analyze Document'}
                </button>
              </div>

              {/* Loading Steps */}
              {loading && (
                <div className="mt-6 bg-slate-50 rounded-xl p-6 space-y-3">
                  <p className="text-sm font-semibold text-slate-700 mb-4">
                    🤖 UiPath Maestro Orchestrating Agents...
                  </p>

                  {/* Step 1 */}
                  <div className={`flex items-center gap-3 text-sm ${loadingStep === 'uploading' ? 'text-blue-600 font-medium' : loadingStep === 'uipath' || loadingStep === 'polling' ? 'text-green-600' : 'text-slate-400'}`}>
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${loadingStep === 'uploading' ? 'bg-blue-600 animate-pulse' : loadingStep === 'uipath' || loadingStep === 'polling' ? 'bg-green-500' : 'border-2 border-slate-300'}`}></div>
                    <span>{loadingStep === 'uipath' || loadingStep === 'polling' ? '✅' : '📤'} Intake Agent — Uploading document</span>
                  </div>

                  {/* Step 2 */}
                  <div className={`flex items-center gap-3 text-sm ${loadingStep === 'uipath' ? 'text-purple-600 font-medium' : loadingStep === 'polling' ? 'text-green-600' : 'text-slate-400'}`}>
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${loadingStep === 'uipath' ? 'bg-purple-600 animate-pulse' : loadingStep === 'polling' ? 'bg-green-500' : 'border-2 border-slate-300'}`}></div>
                    <span>{loadingStep === 'polling' ? '✅' : '🤖'} UiPath Maestro — Triggering orchestration</span>
                  </div>

                  {/* Step 3 */}
                  <div className={`flex items-center gap-3 text-sm ${loadingStep === 'polling' ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${loadingStep === 'polling' ? 'bg-blue-600 animate-pulse' : 'border-2 border-slate-300'}`}></div>
                    <span>📄 Extraction Agent — Extracting content</span>
                  </div>

                  {/* Step 4 */}
                  <div className={`flex items-center gap-3 text-sm ${loadingStep === 'polling' ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${loadingStep === 'polling' ? 'bg-blue-600 animate-pulse' : 'border-2 border-slate-300'}`}></div>
                    <span>📚 Retrieval Agent — Fetching regulations</span>
                  </div>

                  {/* Step 5 */}
                  <div className={`flex items-center gap-3 text-sm ${loadingStep === 'polling' ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${loadingStep === 'polling' ? 'bg-blue-600 animate-pulse' : 'border-2 border-slate-300'}`}></div>
                    <span>✅ Compliance Agent — Checking violations</span>
                  </div>

                  {/* Step 6 */}
                  <div className={`flex items-center gap-3 text-sm ${loadingStep === 'polling' ? 'text-blue-600 font-medium' : 'text-slate-400'}`}>
                    <div className={`w-4 h-4 rounded-full flex-shrink-0 ${loadingStep === 'polling' ? 'bg-blue-600 animate-pulse' : 'border-2 border-slate-300'}`}></div>
                    <span>📋 Report Agent — Generating report</span>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* UiPath Badge */}
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2 w-fit">
              <span className="text-purple-700 text-sm font-medium">🤖 Orchestrated by UiPath Maestro BPMN</span>
            </div>

            {/* Risk Summary */}
            <div
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
              style={{ borderLeft: `6px solid ${getRiskColor(result.report.riskLevel || 'MEDIUM')}` }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Overall Risk Level</p>
                  <span className="text-4xl font-bold" style={{ color: getRiskColor(result.report.riskLevel) }}>
                    {result.report.riskLevel || 'UNKNOWN'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Violations Found</p>
                  <p className="text-4xl font-bold text-slate-900">{result.violations?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Case ID</p>
                  <p className="text-sm font-mono text-slate-900 break-all">{result.caseId}</p>
                </div>
              </div>
            </div>

            {/* Violations */}
            {result.violations && result.violations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">🚨 Detected Violations</h2>
                <div className="space-y-4">
                  {result.violations.map((violation, idx) => (
                    <div
                      key={idx}
                      className={`border rounded-lg p-4 hover:shadow-sm transition-shadow ${
                        violation.reCheckResult === 'overturned'
                          ? 'border-green-300 bg-green-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900">{violation.rule}</h3>
                          <p className="text-sm text-slate-600 mt-1">{violation.reason}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityBadgeColor(violation.severity)}`}>
                          {violation.severity}
                        </span>
                      </div>

                      {violation.reChecked && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-semibold text-blue-900">
                              🔄 Rechecked: {violation.reCheckResult === 'confirmed' ? '✅ Confirmed' : '✅ Overturned'}
                            </span>
                            <span className="text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded">
                              {violation.reCheckConfidence}% confidence
                            </span>
                          </div>
                          {violation.explanation && (
                            <p className="text-xs text-blue-800">{violation.explanation}</p>
                          )}
                        </div>
                      )}

                      {!violation.reChecked && (
                        <button
                          onClick={() => handleRecheck(idx)}
                          disabled={rechecking === idx}
                          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          {rechecking === idx ? '🔄 Rechecking...' : '🔄 Request Recheck'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report */}
            {result.report && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">📋 Compliance Report</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Summary</h3>
                    <p className="text-slate-700">{result.report.summary}</p>
                  </div>
                  {result.report.recommendedActions && (
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3">✅ Recommended Actions</h3>
                      <ul className="space-y-2">
                        {result.report.recommendedActions.map((action, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-slate-700">
                            <span className="text-blue-600 font-bold mt-0.5">→</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.report.nextSteps && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-2">Next Steps</h3>
                      <p className="text-blue-800 text-sm">{result.report.nextSteps}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleReset}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                📤 Analyze Another Document
              </button>
              <button
                onClick={() => {
                  const report = JSON.stringify(result, null, 2);
                  const blob = new Blob([report], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `compliance-report-${result.caseId}.json`;
                  a.click();
                }}
                className="flex-1 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                ⬇️ Download Report
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-600">
          <p>Powered by AI-driven compliance analysis • UiPath AgentHack 2026</p>
        </div>
      </main>
    </div>
  );
}