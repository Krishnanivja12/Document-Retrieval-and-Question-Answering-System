import { create } from 'zustand';

export interface OperationState {
    loading: boolean;
    error: string | null;
    success: boolean;
}

export interface AppState {
    // Upload state
    uploadState: OperationState;
    setUploadLoading: (loading: boolean) => void;
    setUploadError: (error: string | null) => void;
    setUploadSuccess: (success: boolean) => void;
    resetUploadState: () => void;

    // URL ingest state
    ingestState: OperationState;
    setIngestLoading: (loading: boolean) => void;
    setIngestError: (error: string | null) => void;
    setIngestSuccess: (success: boolean) => void;
    resetIngestState: () => void;

    // Index building state
    indexState: OperationState;
    setIndexLoading: (loading: boolean) => void;
    setIndexError: (error: string | null) => void;
    setIndexSuccess: (success: boolean) => void;
    resetIndexState: () => void;

    // Chat state
    chatState: OperationState;
    setChatLoading: (loading: boolean) => void;
    setChatError: (error: string | null) => void;
    resetChatState: () => void;

    // Session state
    sessionId: string | null;
    setSessionId: (id: string | null) => void;

    // Uploaded items
    uploadedItems: Array<{ id: number; filename: string; type: string }>;
    addUploadedItem: (item: { id: number; filename: string; type: string }) => void;
    removeUploadedItem: (id: number) => void;
    clearUploadedItems: () => void;

    // Utility
    isAnyOperationLoading: () => boolean;
}

const initialOperationState: OperationState = {
    loading: false,
    error: null,
    success: false,
};

export const useAppStore = create<AppState>((set, get) => ({
    // Upload state
    uploadState: initialOperationState,
    setUploadLoading: (loading) =>
        set((state) => ({
            uploadState: { ...state.uploadState, loading },
        })),
    setUploadError: (error) =>
        set((state) => ({
            uploadState: { ...state.uploadState, error },
        })),
    setUploadSuccess: (success) =>
        set((state) => ({
            uploadState: { ...state.uploadState, success },
        })),
    resetUploadState: () =>
        set({
            uploadState: initialOperationState,
        }),

    // URL ingest state
    ingestState: initialOperationState,
    setIngestLoading: (loading) =>
        set((state) => ({
            ingestState: { ...state.ingestState, loading },
        })),
    setIngestError: (error) =>
        set((state) => ({
            ingestState: { ...state.ingestState, error },
        })),
    setIngestSuccess: (success) =>
        set((state) => ({
            ingestState: { ...state.ingestState, success },
        })),
    resetIngestState: () =>
        set({
            ingestState: initialOperationState,
        }),

    // Index building state
    indexState: initialOperationState,
    setIndexLoading: (loading) =>
        set((state) => ({
            indexState: { ...state.indexState, loading },
        })),
    setIndexError: (error) =>
        set((state) => ({
            indexState: { ...state.indexState, error },
        })),
    setIndexSuccess: (success) =>
        set((state) => ({
            indexState: { ...state.indexState, success },
        })),
    resetIndexState: () =>
        set({
            indexState: initialOperationState,
        }),

    // Chat state
    chatState: initialOperationState,
    setChatLoading: (loading) =>
        set((state) => ({
            chatState: { ...state.chatState, loading },
        })),
    setChatError: (error) =>
        set((state) => ({
            chatState: { ...state.chatState, error },
        })),
    resetChatState: () =>
        set({
            chatState: initialOperationState,
        }),

    // Session state
    sessionId: null,
    setSessionId: (id) => set({ sessionId: id }),

    // Uploaded items
    uploadedItems: [],
    addUploadedItem: (item) =>
        set((state) => ({
            uploadedItems: [...state.uploadedItems, item],
        })),
    removeUploadedItem: (id) =>
        set((state) => ({
            uploadedItems: state.uploadedItems.filter((item) => item.id !== id),
        })),
    clearUploadedItems: () => set({ uploadedItems: [] }),

    // Utility
    isAnyOperationLoading: () => {
        const state = get();
        return (
            state.uploadState.loading ||
            state.ingestState.loading ||
            state.indexState.loading ||
            state.chatState.loading
        );
    },
}));


