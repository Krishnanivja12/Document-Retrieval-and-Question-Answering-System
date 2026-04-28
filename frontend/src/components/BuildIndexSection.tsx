import { useIndexBuilder } from '../hooks/useIndexBuilder';
import { useAppStore } from '../store/appStore';
import { LoadingSpinner } from './LoadingSpinner';

export const BuildIndexSection = () => {
    const { indexState, handleBuildIndex, canBuildIndex } = useIndexBuilder();
    const { uploadedItems, isAnyOperationLoading } = useAppStore();
    const isDisabled = isAnyOperationLoading() && !indexState.loading;

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
            <h3 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Build Index</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                Create search index from uploaded documents ({uploadedItems.length} items)
            </p>

            <button
                onClick={handleBuildIndex}
                disabled={!canBuildIndex || isDisabled || indexState.loading}
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: !canBuildIndex || isDisabled || indexState.loading ? '#ccc' : '#111827',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: !canBuildIndex || isDisabled || indexState.loading ? 'not-allowed' : 'pointer',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                }}
            >
                {indexState.loading ? (
                    <>
                        <LoadingSpinner size="sm" inline />
                        Building...
                    </>
                ) : (
                    'Build Index'
                )}
            </button>

            {!canBuildIndex && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>
                    Upload files or URLs first to build index
                </p>
            )}

            {indexState.error && (
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
                    Error: {indexState.error}
                </div>
            )}

            {indexState.success && (
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
                    Index built successfully
                </div>
            )}

            {isDisabled && !indexState.loading && (
                <p style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#999', fontStyle: 'italic' }}>
                    Disabled while another operation is in progress
                </p>
            )}
        </div>
    );
};
