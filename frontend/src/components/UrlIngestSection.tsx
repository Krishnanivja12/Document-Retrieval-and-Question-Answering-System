import { useState } from 'react';
import { useUrlIngest } from '../hooks/useUrlIngest';
import { useAppStore } from '../store/appStore';
import { LoadingSpinner } from './LoadingSpinner';

export const UrlIngestSection = () => {
  const [url, setUrl] = useState('');
  const { ingestState, handleIngest } = useUrlIngest();
  const { isAnyOperationLoading } = useAppStore();

  const isDisabled = isAnyOperationLoading() && !ingestState.loading;

  const handleSubmit = async () => {
    if (!url.trim()) return;

    try {
      await handleIngest(url);
      setUrl('');
    } catch {
      // Error already handled in hook
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isDisabled && !ingestState.loading) {
      handleSubmit();
    }
  };

  return (
    <div
      style={{
        padding: '1rem',
        background: '#fafafa',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '1rem',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Ingest URL</h3>
      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>Add web pages to your knowledge base</p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://example.com"
          disabled={isDisabled || ingestState.loading}
          style={{
            flex: 1,
            padding: '0.75rem',
            border: '1px solid #ddd',
            borderRadius: '4px',
            fontSize: '0.9rem',
            opacity: isDisabled ? 0.6 : 1,
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={!url.trim() || isDisabled || ingestState.loading}
          style={{
            padding: '0.75rem 1.5rem',
            background: !url.trim() || isDisabled || ingestState.loading ? '#ccc' : '#111827',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !url.trim() || isDisabled || ingestState.loading ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            whiteSpace: 'nowrap',
          }}
        >
          {ingestState.loading ? (
            <>
              <LoadingSpinner size="sm" inline />
              Fetching...
            </>
          ) : (
            'Ingest'
          )}
        </button>
      </div>

      {ingestState.error && (
        <div
          style={{
            padding: '0.75rem',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            color: '#111827',
            fontSize: '0.85rem',
          }}
        >
          Error: {ingestState.error}
        </div>
      )}

      {ingestState.success && (
        <div
          style={{
            padding: '0.75rem',
            background: '#f9fafb',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            color: '#111827',
            fontSize: '0.85rem',
          }}
        >
          URL ingested successfully
        </div>
      )}

      {isDisabled && !ingestState.loading && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>
          Disabled while another operation is in progress
        </p>
      )}
    </div>
  );
};
