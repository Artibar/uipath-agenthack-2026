import React, { useState } from 'react';
import axios from 'axios';

export default function ComplianceAnalyzer() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const API_BASE_URL = 'http://localhost:3000/api';

  const generateCaseId = () => `CASE-${Date.now()}`;

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
      setFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
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
      LOW: 'bg-green-100 text-green-800 border-green-300'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!file) {
    setError("Please select a file");
    return;
  }

  setLoading(true);
  setError(null);
  setResult(null);

  try {
    const formData = new FormData();
    formData.append("document", file);

    // Step 1: Upload (intake)
    const uploadRes = await axios.post(`${API_BASE_URL}/intake/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    
    const caseId = uploadRes.data.data.caseId;
    console.log('✅ Case created:', caseId);

    // Step 2: Extraction
    await axios.post(`${API_BASE_URL}/extraction/${caseId}`);
    console.log('✅ Extraction done');

    // Step 3: Retrieval
    await axios.post(`${API_BASE_URL}/retrieval/${caseId}`);
    console.log('✅ Retrieval done');

    // Step 4: Compliance
    const complianceRes = await axios.post(`${API_BASE_URL}/compliance/${caseId}`);
    console.log('✅ Compliance done');

    // Step 5: Get final case with report
    const workflow = await axios.post(`${API_BASE_URL}/workflow/${caseId}`);
    console.log(`workflow created for caseId: ${caseId}`, workflow.data)
    const finalRes = await axios.get(`${API_BASE_URL}/workflow/${caseId}`);
    const finalCase = finalRes.data.data;

    setResult({
      caseId,
      violations: finalCase.violations || [],
      report: finalCase.report || {}
    });

    setFile(null);
  } catch (err) {
    console.error('Full error:', err);
    setError(err.response?.data?.message || "Processing failed. Check backend logs.");
  } finally {
    setLoading(false);
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
      <header className="bg-white border-b border-slate-200 sticky top-0 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">📋</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Compliance Analyzer</h1>
              <p className="text-sm text-slate-600">AI-powered document compliance assessment</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Upload Section */}
        {!result && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8">
            <form onSubmit={handleSubmit}>
              {/* Drag & Drop Area */}
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
                    Supported: PDF, DOC, DOCX, TXT
                  </p>
                </label>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">⚠️ {error}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="mt-8 flex gap-4">
                <button
                  type="submit"
                  disabled={!file || loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  {loading ? '⏳ Analyzing...' : '🔍 Analyze Document'}
                </button>
              </div>

              {/* Loading Progress */}
              {loading && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <div className="w-4 h-4 bg-blue-600 rounded-full animate-pulse"></div>
                    <span>Extracting content...</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
                    <span>Retrieving regulations...</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-slate-300 rounded-full"></div>
                    <span>Analyzing compliance...</span>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Risk Summary Card */}
            <div
              className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8"
              style={{
                borderLeft: `6px solid ${getRiskColor(result.report.riskLevel || 'MEDIUM')}`
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Overall Risk Level</p>
                  <div className="flex items-baseline gap-3">
                    <span
                      className="text-4xl font-bold"
                      style={{ color: getRiskColor(result.report.riskLevel) }}
                    >
                      {result.report.riskLevel || 'UNKNOWN'}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Violations Found</p>
                  <p className="text-4xl font-bold text-slate-900">
                    {result.violations?.length || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-2">Case ID</p>
                  <p className="text-sm font-mono text-slate-900 break-all">
                    {result.caseId}
                  </p>
                </div>
              </div>
            </div>

            {/* Violations List */}
            {result.violations && result.violations.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                <h2 className="text-xl font-bold text-slate-900 mb-6">
                  🚨 Detected Violations
                </h2>
                <div className="space-y-4">
                  {result.violations.map((violation, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="font-semibold text-slate-900">{violation.rule}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityBadgeColor(
                            violation.severity
                          )}`}
                        >
                          {violation.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600">{violation.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Report Section */}
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
                      <h3 className="font-semibold text-slate-900 mb-3">
                        ✅ Recommended Actions
                      </h3>
                      <ul className="space-y-2">
                        {result.report.recommendedActions.map((action, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-3 text-slate-700"
                          >
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