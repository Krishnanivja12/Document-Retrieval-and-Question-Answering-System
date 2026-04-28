import { useState } from 'react';
import Toast from '../ui/Toast';

interface SessionDisplayProps {
    sessionId: string | null;
}

export const SessionDisplay = ({ sessionId }: SessionDisplayProps) => {
    const [showToast, setShowToast] = useState(false);

    if (!sessionId) {
        return (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
                <p className="text-sm text-gray-600">No active session</p>
            </div>
        );
    }

    const shortId = sessionId.substring(0, 8);

    const handleCopy = () => {
        navigator.clipboard.writeText(sessionId);
        setShowToast(true);
    };

    return (
        <>
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md flex items-center justify-between">
                <div>
                    <p className="text-xs text-gray-600 mb-1">Session ID</p>
                    <p className="font-mono text-sm text-black" title={sessionId}>
                        {shortId}...
                    </p>
                </div>
                <button
                    onClick={handleCopy}
                    className="px-3 py-2 bg-black text-white text-sm rounded-md hover:bg-gray-900 transition-colors"
                >
                    Copy
                </button>
            </div>
            {showToast && (
                <Toast
                    message="Session ID copied to clipboard"
                    type="success"
                    duration={2000}
                    onClose={() => setShowToast(false)}
                />
            )}
        </>
    );
};


