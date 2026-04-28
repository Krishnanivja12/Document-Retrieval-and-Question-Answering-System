import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUrlIngest } from '../../hooks/useUrlIngest';
import { useAppStore } from '../../store/appStore';

export const UrlIngestCard = () => {
    const [url, setUrl] = useState('');
    const { ingestState, handleIngest } = useUrlIngest();
    const { uploadState, indexState } = useAppStore();

    const isDisabled = (uploadState.loading || indexState.loading) && !ingestState.loading;

    const handleSubmit = async () => {
        if (!url.trim()) return;
        try {
            await handleIngest(url);
            setUrl('');
        } catch {
            // Error handled in hook
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !isDisabled && !ingestState.loading) {
            handleSubmit();
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://example.com"
                disabled={isDisabled || ingestState.loading}
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50 disabled:bg-gray-100 transition-all"
            />

            <motion.button
                whileHover={!isDisabled && !ingestState.loading ? { scale: 1.02 } : {}}
                whileTap={!isDisabled && !ingestState.loading ? { scale: 0.98 } : {}}
                onClick={handleSubmit}
                disabled={!url.trim() || isDisabled || ingestState.loading}
                className="w-full px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-black to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-black disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
                {ingestState.loading ? (
                    <>
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Ingesting...</span>
                    </>
                ) : (
                    <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                        </svg>
                        <span>Ingest URL</span>
                    </>
                )}
            </motion.button>

            {ingestState.error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                >
                    <p className="text-xs font-medium text-gray-700">{ingestState.error}</p>
                </motion.div>
            )}

            {ingestState.success && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                >
                    <p className="text-xs font-medium text-gray-700">URL ingested successfully</p>
                </motion.div>
            )}
        </div>
    );
};

