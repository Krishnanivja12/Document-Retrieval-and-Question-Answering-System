import { useState } from 'react';
import { motion } from 'framer-motion';
import { api, APIError } from '../../services/apiClient';

export const ResetDatabaseCard = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await api.resetDatabase();
      setSuccess(true);
      setShowConfirm(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      let errorMsg = 'Reset failed';

      if (err instanceof APIError) {
        errorMsg = err.message;
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {!showConfirm ? (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowConfirm(true)}
          disabled={loading}
          className="w-full px-3 py-2 text-sm font-semibold bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          Clean Database
        </motion.button>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex gap-2"
        >
          <button
            onClick={handleReset}
            disabled={loading}
            className="flex-1 px-3 py-2 text-xs font-semibold bg-black text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-400 transition-colors flex items-center justify-center gap-1"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Deleting...</span>
              </>
            ) : (
              'Confirm'
            )}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="flex-1 px-3 py-2 text-xs font-semibold bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2 bg-gray-100 border border-gray-300 rounded-lg"
        >
          <p className="text-xs text-gray-800">{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2 bg-gray-100 border border-gray-300 rounded-lg"
        >
          <p className="text-xs text-gray-800">Database reset successfully</p>
        </motion.div>
      )}
    </div>
  );
};


