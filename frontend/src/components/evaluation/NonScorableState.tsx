import Button from '../ui/Button';

interface NonScorableStateProps {
  reason: string;
  onRetry: () => void;
}

export const NonScorableState = ({ reason, onRetry }: NonScorableStateProps) => {
  const reasons: Record<string, string> = {
    'Session state not found': 'No chat history found for this session',
    'Missing question or answer in session state': 'Incomplete chat session',
    'No contexts provided for evaluation': 'No context retrieved during chat',
    'Question is empty': 'The session does not contain a valid question.',
    'Answer is empty': 'The session does not contain a generated answer.',
  };

  const displayReason = reasons[reason] || reason;

  return (
    <div className="p-6 bg-gray-100 border border-gray-300 rounded-md space-y-4">
      <div>
        <h3 className="text-lg font-bold text-black mb-2">Cannot Evaluate Session</h3>
        <p className="text-sm text-gray-800 mb-4">This session cannot be scored because:</p>
        <ul className="text-sm text-gray-800 space-y-1 ml-4">
          <li>- {displayReason}</li>
        </ul>
      </div>
      <div className="flex gap-3">
        <Button variant="ghost" onClick={onRetry} className="flex-1">
          Try Another Session
        </Button>
      </div>
    </div>
  );
};
