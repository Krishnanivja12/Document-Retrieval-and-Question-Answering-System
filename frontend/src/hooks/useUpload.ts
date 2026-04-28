import { useAppStore } from '../store/appStore';
import { api, APIError } from '../services/apiClient';

export const useUpload = () => {
  const {
    uploadState,
    setUploadLoading,
    setUploadError,
    setUploadSuccess,
    resetUploadState,
    addUploadedItem,
  } = useAppStore();

  const handleUpload = async (file: File) => {
    // Validate file size (50MB limit)
    const MAX_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_SIZE) {
      setUploadError('File size exceeds 50MB limit');
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Only PDF, DOCX, and TXT files are allowed.');
      return;
    }

    resetUploadState();
    setUploadLoading(true);

    try {
      const res = await api.uploadFile(file);
      addUploadedItem({
        id: res.id,
        filename: res.filename,
        type: 'file',
      });
      setUploadSuccess(true);
      setUploadError(null);
      return res;
    } catch (error) {
      let errorMsg = 'Upload failed';

      if (error instanceof APIError) {
        errorMsg = error.message;
      } else if (error instanceof Error) {
        errorMsg = error.message;
      }

      setUploadError(errorMsg);
      setUploadSuccess(false);
      throw error;
    } finally {
      setUploadLoading(false);
    }
  };

  return {
    uploadState,
    handleUpload,
    resetUploadState,
  };
};


