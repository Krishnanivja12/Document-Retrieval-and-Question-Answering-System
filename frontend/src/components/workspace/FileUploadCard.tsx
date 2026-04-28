import { useRef } from 'react';
import { motion } from 'framer-motion';
import { useUpload } from '../../hooks/useUpload';
import { useAppStore } from '../../store/appStore';

export const FileUploadCard = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { uploadState, handleUpload } = useUpload();
    const { ingestState, indexState } = useAppStore();

    const isDisabled = (ingestState.loading || indexState.loading) && !uploadState.loading;

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        handleUpload(file).then(() => {
            if (fileInputRef.current) fileInputRef.current.value = '';
        });
    };

    return (
        <div className="flex flex-col gap-3">
            <label
                className={`relative flex flex-col items-center justify-center min-h-[140px] p-4 border-2 border-dashed rounded-lg cursor-pointer transition-all ${isDisabled
                    ? 'border-gray-300 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-400 bg-gray-50 hover:border-black hover:bg-gray-100'
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    disabled={isDisabled || uploadState.loading}
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                />
                <motion.div whileHover={!isDisabled ? { scale: 1.05 } : {}} className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700 mb-1">Click to upload</p>
                    <p className="text-xs text-gray-500">PDF, DOCX, TXT (max 50MB)</p>
                </motion.div>
            </label>

            {uploadState.loading && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                >
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-black border-t-transparent rounded-full flex-shrink-0"
                    />
                    <span className="text-xs font-medium text-gray-700">Uploading...</span>
                </motion.div>
            )}

            {uploadState.error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                >
                    <p className="text-xs font-medium text-gray-700">{uploadState.error}</p>
                </motion.div>
            )}

            {uploadState.success && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
                >
                    <p className="text-xs font-medium text-gray-700">File uploaded successfully</p>
                </motion.div>
            )}
        </div>
    );
};

