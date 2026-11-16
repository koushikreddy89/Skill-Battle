import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { problemService } from '../../services/problemService';
import { CodeEditor } from '../../components/editor/CodeEditor';
import { TestCasePanel } from '../../components/editor/TestCasePanel';
import { SubmissionModal } from '../../components/editor/SubmissionModal';
import { DifficultyBadge } from '../../components/common/DifficultyBadge';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Loader } from '../../components/common/Loader';
import {
  getScopedCode,
  setScopedCode,
  removeScopedCode,
  cleanupLegacyEditorStorage
} from '../../utils/editorStorage';
import {
  Play,
  Send,
  ChevronLeft,
  FileText,
  History,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  RotateCcw
} from 'lucide-react';

export const ProblemWorkspacePage = () => {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leftTab, setLeftTab] = useState('description'); // 'description' | 'submissions'

  // Code editor state
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [runResults, setRunResults] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionError, setActionError] = useState('');

  // Auto-save debounce timer ref
  const saveTimeoutRef = useRef(null);
  // Direct Monaco editor reference for imperative model updates
  const editorRef = useRef(null);

  // Re-fetch and isolate state whenever the problem route changes
  useEffect(() => {
    let isCancelled = false;

    // 1. Immediately reset editor and execution states to guarantee isolation
    setProblem(null);
    setCode('');
    setRunResults(null);
    setSubmissionResult(null);
    setCustomInput('');
    setActionError('');
    setLeftTab('description');
    cleanupLegacyEditorStorage();

    const fetchProblemData = async () => {
      try {
        setLoading(true);
        const res = await problemService.getProblemBySlug(slug);
        if (isCancelled) return;

        if (res.success && res.problem) {
          setProblem(res.problem);

          // 2. Fetch scoped user progress or fall back to official boilerplate
          const savedDraft = getScopedCode(user?._id, res.problem._id, language);
          const initialBoilerplate = res.problem.starterCode?.[language] || '';
          setCode(savedDraft !== null ? savedDraft : initialBoilerplate);
        }
      } catch (err) {
        if (isCancelled) return;
        console.error('Failed to load problem:', err);
        const msg = err.response?.data?.message || 'Could not load problem';
        setActionError(msg);
        toast.error(msg);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchProblemData();

    return () => {
      isCancelled = true;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [slug, user?._id]);

  // Handle Code Change with debounced per-problem scoped storage
  const handleCodeChange = (newCode) => {
    const updated = newCode || '';
    setCode(updated);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (problem?._id) {
        setScopedCode(user?._id, problem._id, language, updated);
      }
    }, 400);
  };

  // Handle language switch: preserve progress for old lang, load/template for new lang
  const handleLanguageChange = (newLang) => {
    if (problem?._id) {
      setScopedCode(user?._id, problem._id, language, code);
    }
    setLanguage(newLang);

    if (problem) {
      const savedForNewLang = getScopedCode(user?._id, problem._id, newLang);
      const templateForNewLang = problem.starterCode?.[newLang] || '';
      setCode(savedForNewLang !== null ? savedForNewLang : templateForNewLang);
    }
    setRunResults(null);
  };

  // Explicit Reset mechanism: clears cached draft and restores official problem boilerplate
  const handleResetStarter = () => {
    if (!problem) return '';

    // 1. Immediately abort any pending auto-save timers to avoid re-saving stale text
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    // 2. Fetch the official starter boilerplate for this problem and language
    const officialTemplate = problem.starterCode?.[language] || '';

    // 3. Clear scoped cache for this problem
    removeScopedCode(user?._id, problem._id, language);

    // 4. Reset editor content in React state & results
    setCode(officialTemplate);
    setRunResults(null);
    setCustomInput('');

    // 5. Directly update the Monaco editor instance model view
    if (editorRef.current) {
      editorRef.current.setValue(officialTemplate);
    }

    toast.info('Code reset to default starter template.');
    return officialTemplate;
  };

  // Run Code against sample test cases
  const handleRunCode = async () => {
    if (isRunning) return;
    try {
      setIsRunning(true);
      setActionError('');
      const res = await problemService.runCode(slug, {
        code,
        language,
        customInput
      });

      if (res.success) {
        setRunResults(res.result);
        if (res.result.passed) {
          toast.success('Sample tests passed! Ready to submit.');
        } else {
          toast.warning(`${res.result.status}: Check testcase outputs.`);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to execute code';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setIsRunning(false);
    }
  };

  // Submit Code against all test cases
  const handleSubmitCode = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setActionError('');
      const res = await problemService.submitCode(slug, {
        code,
        language
      });

      if (res.success) {
        setSubmissionResult(res.submission);
        setIsModalOpen(true);
        if (res.submission.status === 'Accepted') {
          toast.success('Accepted! All test cases passed.');
        } else {
          toast.error(`Submission status: ${res.submission.status}`);
        }
        // Refresh problem details to update solved status and history
        const refreshed = await problemService.getProblemBySlug(slug);
        if (refreshed.success && refreshed.problem) {
          setProblem(refreshed.problem);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to submit code';
      setActionError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Loading workspace..." fullScreen />;
  }

  if (!problem) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Problem not found</h2>
        <Link
          to="/problems"
          className="inline-flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm font-semibold"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Problem Library</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] space-y-3 animate-fade-in">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div className="flex items-center space-x-3">
          <Link
            to="/problems"
            className="p-2 rounded-xl bg-[#161924] hover:bg-[#232738] border border-[#232738] text-gray-400 hover:text-white transition-colors"
            title="Back to Problems"
          >
            <ChevronLeft className="w-4 h-4" />
          </Link>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {problem.title}
              </h1>
              <DifficultyBadge difficulty={problem.difficulty} />
              {problem.userStatus && <StatusBadge status={problem.userStatus} />}
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-gray-500 mt-0.5">
              <span>Acceptance: {problem.acceptanceRate || 0}%</span>
              <span>•</span>
              <span>Submissions: {problem.totalSubmissions || 0}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons: Run & Submit */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleResetStarter}
            title="Reset code to original problem template"
            className="px-3 py-2 rounded-xl bg-[#161924] hover:bg-[#232738] border border-[#2A2E42] text-gray-300 hover:text-white text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleRunCode}
            disabled={isRunning || isSubmitting}
            className="px-4 py-2 rounded-xl bg-[#1F2436] hover:bg-[#2A314A] border border-[#2A2E42] text-white text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-50"
          >
            {isRunning ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
            )}
            <span>Run Code</span>
          </button>

          <button
            onClick={handleSubmitCode}
            disabled={isRunning || isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-900/30 flex items-center space-x-1.5 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            <span>Submit Solution</span>
          </button>
        </div>
      </div>

      {actionError && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Dual-Column Split Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-hidden">
        {/* Left Column: Problem Description, Examples, Past Submissions */}
        <div className="lg:col-span-5 flex flex-col h-full rounded-2xl bg-[#141622] border border-[#232738] overflow-hidden">
          {/* Tab Headers */}
          <div className="flex items-center space-x-1 px-4 py-2.5 bg-[#171A26] border-b border-[#232738]">
            <button
              onClick={() => setLeftTab('description')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                leftTab === 'description'
                  ? 'bg-[#232738] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1C2030]'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Description</span>
            </button>

            <button
              onClick={() => setLeftTab('submissions')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                leftTab === 'submissions'
                  ? 'bg-[#232738] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#1C2030]'
              }`}
            >
              <History className="w-3.5 h-3.5 text-indigo-400" />
              <span>Submissions</span>
            </button>
          </div>

          {/* Left Content Area */}
          <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs text-gray-300 leading-relaxed">
            {leftTab === 'description' ? (
              <>
                {/* Problem Statement */}
                <div className="space-y-3 font-sans">
                  <h3 className="text-base font-bold text-white">{problem.title}</h3>
                  <div className="whitespace-pre-line text-gray-300">
                    {problem.description}
                  </div>
                </div>

                {/* Examples */}
                {problem.examples?.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Examples
                    </h4>
                    {problem.examples.map((ex, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-[#0F1018] border border-[#232738] space-y-1.5 font-mono text-[11px]"
                      >
                        <p className="font-bold text-gray-200">Example {idx + 1}:</p>
                        <p className="text-gray-400">
                          <span className="text-gray-500 font-sans">Input: </span>
                          {ex.input}
                        </p>
                        <p className="text-emerald-400">
                          <span className="text-gray-500 font-sans">Output: </span>
                          {ex.output}
                        </p>
                        {ex.explanation && (
                          <p className="text-gray-400 text-[11px] font-sans pt-1">
                            <span className="text-gray-500">Explanation: </span>
                            {ex.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Constraints */}
                {problem.constraints?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Constraints
                    </h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-400 font-mono text-[11px]">
                      {problem.constraints.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              /* Submissions Tab */
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
                  Your Past Submissions
                </h4>
                {problem.recentSubmissions && problem.recentSubmissions.length > 0 ? (
                  <div className="space-y-2">
                    {problem.recentSubmissions.map((sub, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-[#0F1018] border border-[#232738] flex items-center justify-between"
                      >
                        <div>
                          <span
                            className={`font-semibold text-xs ${
                              sub.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {sub.status}
                          </span>
                          <div className="flex items-center space-x-2 text-[10px] text-gray-500 mt-0.5">
                            <span className="uppercase">{sub.language}</span>
                            <span>•</span>
                            <span>{new Date(sub.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="text-right text-[11px] font-mono text-gray-400">
                          <p>{sub.executionTime}ms</p>
                          <p className="text-[10px] text-gray-500">
                            {sub.testCasesPassed}/{sub.totalTestCases} tests
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-xs">No submissions recorded for this problem yet.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Monaco Code Editor + Test Case Console */}
        <div className="lg:col-span-7 flex flex-col h-full space-y-3 min-h-0 overflow-hidden">
          {/* Monaco Editor Pane with explicit Key isolation */}
          <div className="flex-1 min-h-[320px]">
            <CodeEditor
              key={`${problem._id}_${language}`}
              editorRef={editorRef}
              code={code}
              onChange={handleCodeChange}
              language={language}
              onLanguageChange={handleLanguageChange}
              onResetStarter={handleResetStarter}
              height="100%"
            />
          </div>

          {/* Test Case / Results Drawer */}
          <div className="h-64 shrink-0">
            <TestCasePanel
              sampleTestCases={problem.sampleTestCases}
              customInput={customInput}
              onCustomInputChange={setCustomInput}
              runResults={runResults}
              isRunning={isRunning}
            />
          </div>
        </div>
      </div>

      {/* Submission Result Modal */}
      <SubmissionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        submission={submissionResult}
        onNextProblem={() => navigate('/problems')}
      />
    </div>
  );
};
