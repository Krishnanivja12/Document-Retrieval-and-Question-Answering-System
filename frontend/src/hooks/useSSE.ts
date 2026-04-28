import { useCallback, useRef, useState } from 'react';

interface SSEOptions {
    onToken?: (token: string) => void;
    onDone?: () => void;
    onError?: (error: string) => void;
}

export const useSSE = (url: string, options: SSEOptions) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const controllerRef = useRef<AbortController | null>(null);

    const start = useCallback(async () => {
        setIsStreaming(true);
        const controller = new AbortController();
        controllerRef.current = controller;
        try {
            const response = await fetch(url, { signal: controller.signal });
            const reader = response.body?.getReader();
            if (!reader) return;
            const decoder = new TextDecoder();
            let buffer = '';
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6);
                        if (data === '[DONE]') {
                            options.onDone?.();
                            return;
                        }
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.token) options.onToken?.(parsed.token);
                            if (parsed.event === 'node_complete') console.log('Node:', parsed.node);
                            if (parsed.error) options.onError?.(parsed.error);
                        } catch { }
                    }
                }
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') options.onError?.(err.message);
        } finally {
            setIsStreaming(false);
        }
    }, [url]);

    const stop = () => controllerRef.current?.abort();
    return { start, stop, isStreaming };
};

