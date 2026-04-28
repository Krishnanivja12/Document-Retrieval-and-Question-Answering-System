import { useState } from "react";
import { api, APIError } from "../services/apiClient";

type EvalScores = {
  faithfulness?: number;
  answer_relevancy?: number;
  context_precision?: number;
};

const EvaluationPanel = ({ sessionId }: { sessionId: string }) => {
  const [scores, setScores] = useState<EvalScores | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runEval = async () => {
    if (!sessionId || loading) return;

    setLoading(true);
    setError(null);
    try {
      const data = await api.runEvaluation(sessionId);
      setScores(data);
    } catch (error) {
      if (error instanceof APIError) {
        setError(error.message);
      } else if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Evaluation failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stack">
      <button className="btn" onClick={runEval} disabled={loading}>
        {loading ? "Evaluating..." : "Evaluate Answer"}
      </button>
      {scores && (
        <ul className="metric-list">
          <li>Faithfulness: {scores.faithfulness?.toFixed(2) ?? "N/A"}</li>
          <li>Answer Relevancy: {scores.answer_relevancy?.toFixed(2) ?? "N/A"}</li>
          <li>Context Precision: {scores.context_precision?.toFixed(2) ?? "N/A"}</li>
        </ul>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
};

export default EvaluationPanel;


