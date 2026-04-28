import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ChatPage from "./pages/ChatPage";
import EvaluationPage from "./pages/EvaluationPage";
import WorkspacePage from "./pages/WorkspacePage";
import LandingPage from "./pages/LandingPage";
import { ErrorBoundary } from "./components/ErrorBoundary";

const links = [
  { to: "/workspace", label: "Workspace" },
  { to: "/chat", label: "Chat" },
  { to: "/evaluate", label: "Evaluate" },
];

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  if (isLanding) {
    return <>{children}</>;
  }

  return (
    <div className="app-shell full-screen">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 backdrop-blur-lg bg-opacity-95 animate-slide-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-3"
            >
              <NavLink to="/" className="flex items-center gap-3 group">
                <motion.div
                  whileHover={{ rotate: 12 }}
                  transition={{ duration: 0.3 }}
                  className="w-8 h-8 bg-black rounded-lg"
                />
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Agentic RAG
                  </p>
                  <h1 className="text-lg font-bold text-black">Knowledge Workspace</h1>
                </div>
              </NavLink>
            </motion.div>

            <nav className="flex gap-2" aria-label="Primary navigation">
              {links.map((link, index) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <NavLink
                    to={link.to}
                    className={({ isActive }) =>
                      `px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-0.5 ${isActive
                        ? "bg-black text-white shadow-lg"
                        : "text-gray-700 hover:bg-gray-100"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-50">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

const App = () => (
  <ErrorBoundary>
    <AppLayout>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/workspace" element={<WorkspacePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/evaluate" element={<EvaluationPage />} />
      </Routes>
    </AppLayout>
  </ErrorBoundary>
);

export default App;


