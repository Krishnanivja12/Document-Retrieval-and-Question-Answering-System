import { useRef } from 'react';
import { useUpload } from '../hooks/useUpload';
import { useAppStore } from '../store/appStore';
import { LoadingSpinner } from './LoadingSpinner';

export const UploadSection = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadState, handleUpload } = useUpload();
  const { isAnyOperationLoading } = useAppStore();

  const isDisabled = isAnyOperationLoading() && !uploadState.loading;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    handleUpload(file)
      .then(() => {
        if (fileInputRef.current) fileInputRef.current.value = '';
      })
      .catch(() => {
        // Error already handled in hook
      });
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
      <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Upload File</h3>
      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
        Add PDF, DOCX, or TXT files to your knowledge base
      </p>

      <label
        style={{
          display: 'block',
          padding: '2rem',
          border: '2px dashed #111827',
          borderRadius: '6px',
          textAlign: 'center',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          background: isDisabled ? '#f5f5f5' : '#fafafa',
          opacity: isDisabled ? 0.6 : 1,
          transition: 'all 0.2s',
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          disabled={isDisabled || uploadState.loading}
          accept=".pdf,.docx,.txt"
          style={{ display: 'none' }}
        />
        <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>FILE</div>
        <p style={{ margin: '0.5rem 0', fontWeight: '500' }}>Click to select or drag file here</p>
        <p style={{ margin: '0.25rem 0', fontSize: '0.85rem', color: '#999' }}>PDF, DOCX, or TXT (max 50MB)</p>
      </label>

      {uploadState.loading && (
        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <LoadingSpinner size="sm" inline />
          <span style={{ fontSize: '0.9rem', color: '#666' }}>Uploading...</span>
        </div>
      )}

      {uploadState.error && (
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
          Error: {uploadState.error}
        </div>
      )}

      {uploadState.success && (
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
          File uploaded successfully
        </div>
      )}

      {isDisabled && !uploadState.loading && (
        <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>
          Disabled while another operation is in progress
        </p>
      )}
    </div>
  );
};
