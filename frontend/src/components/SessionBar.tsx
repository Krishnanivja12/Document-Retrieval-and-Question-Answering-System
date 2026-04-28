import { useState } from 'react';

export interface SessionBarProps {
  sessionId: string | null;
}

export const SessionBar = ({ sessionId }: SessionBarProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!sessionId) return;
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!sessionId) return null;

  return (
    <div className="session-bar" style={{
      marginTop: '1rem',
      padding: '0.75rem',
      background: '#f5f5f5',
      borderRadius: '6px',
      border: '1px solid #e0e0e0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '0.75rem',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <label style={{ fontSize: '0.75rem', fontWeight: '600', color: '#666', display: 'block', marginBottom: '0.25rem' }}>
          Session ID
        </label>
        <code
          title={sessionId}
          style={{
            fontSize: '0.85rem',
            color: '#1976d2',
            wordBreak: 'break-all',
            display: 'block',
            fontFamily: 'monospace',
          }}
        >
          {sessionId}
        </code>
      </div>
      <button
        onClick={handleCopy}
        className="btn-copy"
        title="Copy session ID"
        style={{
          padding: '0.5rem 0.75rem',
          background: copied ? '#4caf50' : '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontWeight: '500',
          transition: 'background 0.2s',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
};


