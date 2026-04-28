import { useAppStore } from '../store/appStore';
import { motion } from 'framer-motion';
import { FileUploadCard, UrlIngestCard, IndexBuilder, ResetDatabaseCard, DocumentCard } from '../components/workspace';

const WorkspacePage = () => {
  const { uploadedItems, removeUploadedItem } = useAppStore();

  const handleDeleteDocument = (id: number) => {
    removeUploadedItem(id);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-gradient-to-br from-gray-50 via-white to-gray-100 overflow-hidden">
      <div className="max-w-7xl h-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Full Height Bento Grid Layout */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-12 gap-3 h-full"
        >

          {/* Left Column - Upload, URL, Index Stacked */}
          <div className="lg:col-span-5 flex flex-col gap-3 overflow-hidden">

            {/* Upload Documents */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-gray-300 flex-shrink-0"
            >
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-black">Upload Documents</h2>
                    <p className="text-xs text-gray-600">PDF, DOCX, TXT files</p>
                  </div>
                </div>
              </div>
              <FileUploadCard />
            </motion.div>

            {/* URL Ingest */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-gray-300 flex-shrink-0"
            >
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-black">Ingest URL</h2>
                    <p className="text-xs text-gray-600">Add web content</p>
                  </div>
                </div>
              </div>
              <UrlIngestCard />
            </motion.div>

            {/* Build Index */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:border-gray-300 flex-shrink-0"
            >
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-black">Build Index</h2>
                    <p className="text-xs text-gray-600">Process documents</p>
                  </div>
                </div>
              </div>
              <IndexBuilder />
            </motion.div>
          </div>

          {/* Right Column - Documents & Danger Zone */}
          <div className="lg:col-span-7 flex flex-col gap-3 h-full overflow-hidden">

            {/* Document List - Flexible Height with Internal Scroll */}
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex-1 flex flex-col overflow-hidden"
            >
              <div className="mb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-black">
                        Documents {uploadedItems.length > 0 && `(${uploadedItems.length})`}
                      </h2>
                      <p className="text-xs text-gray-600">Uploaded files and URLs</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin pr-2">
                {uploadedItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-8"
                  >
                    <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-600">No documents yet</p>
                    <p className="text-xs text-gray-400 mt-1">Upload files or add URLs to get started</p>
                  </motion.div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pb-2">
                    {uploadedItems.map((item, index) => (
                      <DocumentCard
                        key={item.id}
                        id={item.id}
                        filename={item.filename}
                        type={item.type}
                        index={index}
                        onDelete={handleDeleteDocument}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Danger Zone - Fixed at Bottom */}
            <motion.div
              variants={itemVariants}
              whileHover={{ scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.18)" }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border-2 border-gray-300 p-4 shadow-sm flex-shrink-0"
            >
              <div className="mb-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 bg-gradient-to-br from-gray-700 to-black rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-black">Danger Zone</h2>
                    <p className="text-xs text-gray-700">Reset database (cannot be undone)</p>
                  </div>
                </div>
              </div>
              <ResetDatabaseCard />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WorkspacePage;


