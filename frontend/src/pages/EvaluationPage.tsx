import { useState } from "react";
import { motion } from "framer-motion";
import { api, APIError } from "../services/apiClient";
import Toast from "../components/ui/Toast";

type EvalScores = {
  faithfulness?: number;
  answer_relevancy?: number;
  context_precision?: number;
};

type EvalResult = {
  session_id: string;
  question: string;
  answer: string;
  faithfulness?: number;
  answer_relevancy?: number;
  context_precision?: number;
  created_at?: string;
};

const getEvaluationErrorDisplay = (error: unknown): { title: string; message: string } => {
  if (error instanceof APIError) {
    if (error.code === "session_not_found" || error.status === 404) {
      return {
        title: "Session Not Found",
        message: "No chat history was found for this session ID.",
      };
    }
    if (error.code === "non_scorable_session" || error.status === 422) {
      return {
        title: "Session Not Scorable",
        message: error.message,
      };
    }
    if (error.code === "evaluation_provider_error" || error.status === 503) {
      return {
        title: "Evaluation Provider Unavailable",
        message: "Evaluation key is missing or provider unavailable. Configure COHERE_API_KEY and retry.",
      };
    }
    return {
      title: "Evaluation Failed",
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return { title: "Evaluation Failed", message: error.message };
  }

  return { title: "Evaluation Failed", message: "Unexpected error while evaluating the session." };
};

const EvaluationPage = () => {
  const [sessionId, setSessionId] = useState("");
  const [scores, setScores] = useState<EvalScores | null>(null);
  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [status, setStatus] = useState("Ready");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState("Cannot Evaluate Session");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const runEval = async () => {
    if (!sessionId.trim() || loading) return;

    setLoading(true);
    setStatus("Running evaluation...");
    setScores(null);
    setEvalResult(null);
    setError(null);
    setErrorTitle("Cannot Evaluate Session");

    try {
      const data = await api.runEvaluation(sessionId);
      setScores(data);
      setStatus("Completed");

      try {
        const result = await api.getEvaluation(sessionId);
        setEvalResult(result);
      } catch {
        // Ignore if full result fetch fails
      }

      setToastMessage("Evaluation completed successfully!");
      setShowToast(true);
    } catch (err) {
      const display = getEvaluationErrorDisplay(err);
      setErrorTitle(display.title);
      setError(display.message);
      setStatus("Error");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setSessionId("");
    setScores(null);
    setEvalResult(null);
    setError(null);
    setErrorTitle("Cannot Evaluate Session");
    setStatus("Ready");
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-black bg-white border-black';
    if (score >= 0.6) return 'text-gray-800 bg-gray-100 border-gray-400';
    return 'text-gray-700 bg-gray-100 border-gray-300';
  };

  const getProgressColor = (score: number) => {
    if (score >= 0.8) return 'bg-black';
    if (score >= 0.6) return 'bg-gray-700';
    return 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
          >
            <h1 className="text-xl font-bold text-black mb-1">Evaluate Session Quality</h1>
            <p className="text-sm text-gray-600">
              Analyze your chat session using DeepEval metrics
            </p>
          </motion.div>

          {/* Session Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-black mb-2">Session ID</label>
                <input
                  type="text"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  placeholder="Enter session ID from chat"
                  disabled={loading}
                  className="w-full px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={runEval}
                disabled={!sessionId.trim() || loading}
                className="w-full px-4 py-3 text-sm font-semibold bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Evaluating...</span>
                  </>
                ) : (
                  'Evaluate'
                )}
              </motion.button>
            </div>
          </motion.div>

          {/* Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Status</p>
                <p className={`text-sm font-semibold ${status === 'Error' ? 'text-gray-700' :
                    status === 'Completed' ? 'text-gray-700' :
                      'text-gray-600'
                  }`}>
                  {status}
                </p>
              </div>
              {loading && (
                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
              )}
            </div>
          </motion.div>

          {/* Error State */}
          {error && !scores && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-100 rounded-xl border-2 border-gray-300 p-5 shadow-sm"
          >
            <h3 className="text-base font-bold text-black mb-2">{errorTitle}</h3>
            <p className="text-sm text-gray-800 mb-4">{error}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRetry}
                className="px-4 py-2 text-sm font-semibold bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                Try Another Session
              </motion.button>
            </motion.div>
          )}

          {/* Results */}
          {scores && (
            <>
              {/* Question & Answer */}
              {evalResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                >
                  <h3 className="text-sm font-bold text-black mb-3">Session Details</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Question</p>
                      <p className="text-sm text-black">{evalResult.question}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Answer</p>
                      <p className="text-sm text-black">{evalResult.answer}</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {scores.faithfulness !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`rounded-xl border-2 p-5 shadow-sm ${getScoreColor(scores.faithfulness)}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2">Faithfulness</p>
                    <p className="text-3xl font-bold mb-3">{Math.round(scores.faithfulness * 100)}%</p>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scores.faithfulness * 100}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        className={`h-full ${getProgressColor(scores.faithfulness)}`}
                      />
                    </div>
                  </motion.div>
                )}

                {scores.answer_relevancy !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`rounded-xl border-2 p-5 shadow-sm ${getScoreColor(scores.answer_relevancy)}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2">Answer Relevancy</p>
                    <p className="text-3xl font-bold mb-3">{Math.round(scores.answer_relevancy * 100)}%</p>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scores.answer_relevancy * 100}%` }}
                        transition={{ duration: 1, delay: 0.4 }}
                        className={`h-full ${getProgressColor(scores.answer_relevancy)}`}
                      />
                    </div>
                  </motion.div>
                )}

                {scores.context_precision !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`rounded-xl border-2 p-5 shadow-sm ${getScoreColor(scores.context_precision)}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2">Context Precision</p>
                    <p className="text-3xl font-bold mb-3">{Math.round(scores.context_precision * 100)}%</p>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scores.context_precision * 100}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full ${getProgressColor(scores.context_precision)}`}
                      />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Success Message */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-gray-100 rounded-xl border-2 border-gray-300 p-4 shadow-sm"
              >
                <p className="text-sm text-gray-700">
                  Evaluation completed successfully. Scores range from 0-100%. Higher scores indicate better quality.
                </p>
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          duration={3000}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );
};

export default EvaluationPage;


