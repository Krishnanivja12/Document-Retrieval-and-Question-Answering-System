import { useState } from "react";
import { useAppStore } from "../store/appStore";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Toast from "../components/ui/Toast";

type AgentStreamEvent = {
  session_id?: string;
  event?: string;
  node?: string;
  token?: string;
  error?: string;
  type?: string;
};

const ChatPage = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
  }>>([]);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const {
    sessionId,
    setSessionId,
    chatState,
    setChatLoading,
    setChatError,
    resetChatState,
    uploadState,
    ingestState,
    indexState,
  } = useAppStore();

  const isChatDisabled = (uploadState.loading || ingestState.loading || indexState.loading);

  const handleAsk = async () => {
    if (!question.trim() || chatState.loading || isChatDisabled) return;

    const userMessage = question;
    setMessages((prev) => [...prev, { role: "user", content: userMessage, timestamp: new Date() }]);
    setQuestion("");
    resetChatState();
    setChatLoading(true);
    setShowError(false);

    let assistantMessage = "";

    try {
      const response = await fetch("/api/v1/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userMessage, session_id: sessionId ?? undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = (errorData as { detail?: string }).detail || `Server error: ${response.status}`;
        throw new Error(errorMsg);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        const error = "No response from server";
        setChatError(error);
        setErrorMessage(error);
        setShowError(true);
        setMessages((prev) => [...prev, { role: "assistant", content: "Error: No response from server", timestamp: new Date() }]);
        setChatLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();

          if (data === "[DONE]") {
            setChatLoading(false);
            return;
          }

          try {
            const parsed = JSON.parse(data) as AgentStreamEvent;

            if (parsed.session_id && !sessionId) {
              setSessionId(parsed.session_id);
            }

            if (parsed.token) {
              assistantMessage += parsed.token;
              setMessages((prev) => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === "assistant") {
                  updated[updated.length - 1].content = assistantMessage;
                } else {
                  updated.push({ role: "assistant", content: assistantMessage, timestamp: new Date() });
                }
                return updated;
              });
            }

            if (parsed.error) {
              setChatError(parsed.error);
              setErrorMessage(parsed.error);
              setShowError(true);
              setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${parsed.error}`, timestamp: new Date() }]);
              setChatLoading(false);
              return;
            }
          } catch {
            // Ignore malformed JSON
          }
        }
      }

      setChatLoading(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Connection failed";
      setChatError(errorMsg);
      setErrorMessage(errorMsg);
      setShowError(true);
      setMessages((prev) => [...prev, { role: "assistant", content: `Error: ${errorMsg}`, timestamp: new Date() }]);
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  const copySessionId = async () => {
    if (!sessionId) return;
    try {
      await navigator.clipboard.writeText(sessionId);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center overflow-hidden">
      <div className="max-w-5xl w-full h-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">

        {/* Session ID Bar - Compact */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-shrink-0 mb-4 bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Session ID</p>
            {sessionId ? (
              <p className="text-sm font-mono text-black truncate">{sessionId}</p>
            ) : (
              <p className="text-sm text-gray-400">No active session</p>
            )}
          </div>
          {sessionId && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={copySessionId}
              className="ml-3 px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all"
            >
              Copy
            </motion.button>
          )}
        </motion.div>

        {/* Chat Messages - Flexible Height */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex-1 bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-4 hover:shadow-md transition-shadow overflow-hidden flex flex-col"
        >
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatType: "reverse"
                    }}
                    className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </motion.div>
                  <p className="text-sm font-semibold text-gray-600">Start a conversation...</p>
                  <p className="text-xs text-gray-400 mt-1">Ask questions about your documents</p>
                </motion.div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20, scale: 0.95 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className={`max-w-[80%] px-4 py-3 rounded-xl shadow-sm ${msg.role === 'user'
                        ? 'bg-gradient-to-br from-black to-gray-800 text-white rounded-br-sm'
                        : 'bg-gradient-to-br from-gray-100 to-gray-200 text-black rounded-bl-sm border border-gray-300'
                        }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    </motion.div>
                  </motion.div>
                ))}

                {chatState.loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 px-4 py-3 rounded-xl rounded-bl-sm border border-gray-300 shadow-sm">
                      <div className="flex gap-1.5">
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                          className="w-2 h-2 bg-gray-600 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                          className="w-2 h-2 bg-gray-600 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -8, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                          className="w-2 h-2 bg-gray-600 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.div>

        {/* Input Area - Fixed at Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex gap-3">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your question... (Shift+Enter for new line)"
              disabled={isChatDisabled || chatState.loading}
              className="flex-1 px-4 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:opacity-50 disabled:bg-gray-100 resize-none transition-all"
              rows={2}
            />
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAsk}
              disabled={!question.trim() || isChatDisabled || chatState.loading}
              className="px-6 py-3 text-sm font-semibold bg-gradient-to-r from-black to-gray-800 text-white rounded-lg hover:from-gray-800 hover:to-black disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {chatState.loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  <span>Sending</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  <span>Send</span>
                </>
              )}
            </motion.button>
          </div>

          {/* Evaluate Button */}
          {sessionId && messages.length > 0 && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.02, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate("/evaluate")}
              className="w-full mt-3 px-4 py-2.5 text-sm font-semibold bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg hover:from-gray-200 hover:to-gray-300 transition-all"
            >
              Evaluate This Session
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Error Toast */}
      {showError && (
        <Toast
          message={errorMessage}
          type="error"
          duration={5000}
          onClose={() => setShowError(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;


