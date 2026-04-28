import { useAppStore } from '../store/appStore';
import { UploadSection } from '../components/UploadSection';
import { UrlIngestSection } from '../components/UrlIngestSection';
import { BuildIndexSection } from '../components/BuildIndexSection';
import { ResetDatabaseSection } from '../components/ResetDatabaseSection';

const UploadPage = () => {
  const { uploadedItems } = useAppStore();

  return (
    <section className="stack-lg">
      <article className="card">
        <h2>Upload Documents</h2>
        <p className="muted">Add files and URLs to build your knowledge base</p>

        <div className="stack">
          <UploadSection />
          <UrlIngestSection />
          <BuildIndexSection />
        </div>

        {uploadedItems.length > 0 && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--surface-border)' }}>
            <h3 style={{ marginBottom: '1rem' }}>Uploaded Items ({uploadedItems.length})</h3>
            <div className="stack">
              {uploadedItems.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '0.75rem',
                    background: '#fafafa',
                    borderRadius: '6px',
                    border: '1px solid var(--surface-border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>{item.type === 'file' ? 'FILE' : 'URL'}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: '500', margin: '0 0 0.25rem 0' }}>{item.filename}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>ID: {item.id}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <ResetDatabaseSection />
      </article>
    </section>
  );
};

export default UploadPage;


