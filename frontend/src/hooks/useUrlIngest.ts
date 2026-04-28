import { useAppStore } from '../store/appStore';
import { api, APIError } from '../services/apiClient';
import { isValidURL } from '../utils/sanitize';

export const useUrlIngest = () => {
  const {
    ingestState,
    setIngestLoading,
    setIngestError,
    setIngestSuccess,
    resetIngestState,
    addUploadedItem,
  } = useAppStore();

  const handleIngest = async (url: string) => {
    // Validate URL
    if (!isValidURL(url)) {
      setIngestError('Invalid URL format. Please enter a valid HTTP or HTTPS URL.');
      return;
    }

    resetIngestState();
    setIngestLoading(true);

    try {
      const res = await api.ingestURL(url);
      addUploadedItem({
        id: res.id,
        filename: res.filename,
        type: 'url',
      });
      setIngestSuccess(true);
      setIngestError(null);
      return res;
    } catch (error) {
      let errorMsg = 'URL ingestion failed';

      if (error instanceof APIError) {
        errorMsg = error.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      setIngestError(errorMsg);
      setIngestSuccess(false);
      throw error;
    } finally {
      setIngestLoading(false);
    }
  };

  return {
    ingestState,
    handleIngest,
    resetIngestState,
  };
};


