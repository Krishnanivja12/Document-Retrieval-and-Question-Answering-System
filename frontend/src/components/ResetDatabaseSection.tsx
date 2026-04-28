import { useState } from 'react';
import { resetDatabase } from '../services/api';
import { LoadingSpinner } from './LoadingSpinner';

export const ResetDatabaseSection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await resetDatabase();
      setResult(response);
      setSuccess(true);
      setShowConfirm(false);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Reset failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        padding: '1rem',
        background: '#f5f5f5',
        borderRadius: '8px',
        border: '1px solid #d1d5db',
        marginTop: '1.5rem',
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#111827' }}>Danger Zone</h3>
      <p style={{ fontSize: '0.85rem', color: '#374151', marginBottom: '1rem' }}>
        Clear all documents and reset the vector database. This action cannot be undone.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            background: '#111827',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Clean Database
        </button>
      ) : (
        <div
          style={{
            padding: '1rem',
            background: '#f3f4f6',
            borderRadius: '4px',
            border: '1px solid #d1d5db',
          }}
        >
          <p style={{ margin: '0 0 1rem 0', color: '#111827', fontWeight: '500' }}>
            Confirm reset? This will delete all documents and reset the vector database.
          </p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handleReset}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#111827',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" inline />
                  Resetting...
                </>
              ) : (
                'Yes, Delete Everything'
              )}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={loading}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: '500',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            color: '#111827',
            fontSize: '0.85rem',
          }}
        >
          Error: {error}
        </div>
      )}

      {success && result && (
        <div
          style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#f9fafb',
            border: '1px solid #d1d5db',
            borderRadius: '4px',
            color: '#111827',
            fontSize: '0.85rem',
          }}
        >
          <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>Database reset successfully.</p>
          <ul style={{ margin: '0.5rem 0 0 1.5rem', paddingLeft: 0 }}>
            <li>Deleted vectors: {result.cleared.faiss_vectors}</li>
            <li>Reset chunks: {result.cleared.chunks}</li>
            <li>Cleared evaluations: {result.cleared.evaluations}</li>
          </ul>
        </div>
      )}
    </div>
  );
};
