import { motion } from 'framer-motion';
import { useIndexBuilder } from '../../hooks/useIndexBuilder';
import { useAppStore } from '../../store/appStore';

export const IndexBuilder = () => {
  const { indexState, handleBuildIndex, canBuildIndex } = useIndexBuilder();
  const { uploadedItems } = useAppStore();

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-gray-600 bg-gradient-to-r from-gray-100 to-gray-200 px-3 py-2.5 rounded-lg border border-gray-300">
        <span className="font-semibold">{uploadedItems.length}</span> document(s) ready to index
      </div>

      <motion.button
        whileHover={canBuildIndex && !indexState.loading ? { scale: 1.02 } : {}}
        whileTap={canBuildIndex && !indexState.loading ? { scale: 0.98 } : {}}
        onClick={handleBuildIndex}
        disabled={!canBuildIndex || indexState.loading}
        className="w-full px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-black to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-black disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {indexState.loading ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
            />
            <span>Building...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Build Index</span>
          </>
        )}
      </motion.button>

      {!canBuildIndex && (
        <p className="text-xs text-gray-500 italic text-center">Upload files or URLs first</p>
      )}

      {indexState.error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
        >
          <p className="text-xs font-medium text-gray-700">{indexState.error}</p>
        </motion.div>
      )}

      {indexState.success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg"
        >
          <p className="text-xs font-medium text-gray-700">Index built successfully</p>
        </motion.div>
      )}
    </div>
  );
};

