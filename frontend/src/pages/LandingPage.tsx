import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParticleBackground } from '../components/three/ParticleBackground';
import { FloatingCube } from '../components/three/FloatingCube';

const LandingPage = () => {
    const navigate = useNavigate();

    const features = [
        {
            icon: 'DOC',
            title: 'Document Upload',
            description: 'Upload PDFs, DOCX, and TXT files to build your knowledge base',
        },
        {
            icon: 'URL',
            title: 'URL Ingestion',
            description: 'Extract content from web pages and add to your database',
        },
        {
            icon: 'AI',
            title: 'AI-Powered Chat',
            description: 'Ask questions and get intelligent answers from your documents',
        },
        {
            icon: 'RAG',
            title: 'Quality Evaluation',
            description: 'Measure response quality with DeepEval metrics',
        },
    ];

    return (
        <div className="relative min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
            <ParticleBackground />

            <div className="relative z-10 min-h-screen flex flex-col">
                <header className="px-4 sm:px-6 lg:px-8 py-6">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 bg-black rounded-lg"></div>
                        <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Agentic RAG</p>
                            <h1 className="text-lg font-bold text-black">Knowledge Workspace</h1>
                        </div>
                    </motion.div>
                </header>

                <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl w-full">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                            <motion.div
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="space-y-8"
                            >
                                <div className="space-y-4">
                                    <motion.h2
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.8, delay: 0.4 }}
                                        className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-black leading-tight"
                                    >
                                        Your AI-Powered
                                        <br />
                                        <span className="bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                            Knowledge Hub
                                        </span>
                                    </motion.h2>

                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.8, delay: 0.6 }}
                                        className="text-lg sm:text-xl text-gray-600 max-w-xl"
                                    >
                                        Upload documents, ask questions, and get intelligent answers powered by advanced RAG technology and agentic workflows.
                                    </motion.p>
                                </div>

                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.8 }}
                                    className="flex flex-col sm:flex-row gap-4"
                                >
                                    <button
                                        onClick={() => navigate('/workspace')}
                                        className="group relative px-8 py-4 bg-black text-white text-lg font-semibold rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-105"
                                    >
                                        <span className="relative z-10">Get Started</span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-gray-900 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                    </button>

                                    <button
                                        onClick={() => navigate('/chat')}
                                        className="px-8 py-4 bg-white text-black text-lg font-semibold rounded-xl border-2 border-gray-300 hover:border-black transition-all duration-300 hover:shadow-lg hover:scale-105"
                                    >
                                        Try Chat
                                    </button>
                                </motion.div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className="flex items-center justify-center"
                            >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full blur-3xl opacity-30"></div>
                                    <FloatingCube size={300} />
                                </div>
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 1.2 }}
                            className="mt-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                        >
                            {features.map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 1.4 + index * 0.1 }}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300"
                                >
                                    <div className="text-xl font-bold mb-4 text-black">{feature.icon}</div>
                                    <h3 className="text-lg font-bold text-black mb-2">{feature.title}</h3>
                                    <p className="text-sm text-gray-600">{feature.description}</p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </main>

                <footer className="px-4 sm:px-6 lg:px-8 py-6">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 1.6 }}
                        className="text-center text-sm text-gray-500"
                    >
                        <p>Powered by LangGraph, OpenAI, and FAISS</p>
                    </motion.div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
