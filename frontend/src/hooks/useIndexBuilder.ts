import { useAppStore } from '../store/appStore';
import { api, APIError } from '../services/apiClient';

export const useIndexBuilder = () => {
  const {
    indexState,
    setIndexLoading,
    setIndexError,
    setIndexSuccess,
    resetIndexState,
    uploadedItems,
  } = useAppStore();

  const handleBuildIndex = async () => {
    if (uploadedItems.length === 0) {
      setIndexError('No items to index. Please upload files or URLs first.');
      return;
    }

    resetIndexState();
    setIndexLoading(true);

    try {
      const res = await api.buildIndex();
      setIndexSuccess(true);
      setIndexError(null);
      return res;
    } catch (error) {
      let errorMsg = 'Index build failed';

      if (error instanceof APIError) {
        errorMsg = error.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      setIndexError(errorMsg);
      setIndexSuccess(false);
      throw error;
    } finally {
      setIndexLoading(false);
    }
  };

  return {
    indexState,
    handleBuildIndex,
    resetIndexState,
    canBuildIndex: uploadedItems.length > 0,
  };
};


