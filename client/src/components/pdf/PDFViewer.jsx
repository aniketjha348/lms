import { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { 
  FiZoomIn, 
  FiZoomOut, 
  FiMaximize,
  FiMinimize,
  FiDownload,
  FiX
} from 'react-icons/fi';
import styles from './PDFViewer.module.css';

// Set worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDFViewer = ({ pdfUrl, title, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef(null);

  // Get container width for responsive PDF sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth - 20);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onDocumentLoadError = (error) => {
    console.error('PDF Load Error:', error);
    setIsLoading(false);
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 2.5));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const fitToWidth = () => {
    setScale(1.0);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!pdfUrl) {
    return (
      <div className={styles.placeholder}>
        <div className={styles.placeholderIcon}>📄</div>
        <p>No notes available</p>
      </div>
    );
  }

  // Custom PDF viewer with continuous scroll
  return (
    <div 
      ref={containerRef}
      className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}
    >
      {/* Header */}
      <div className={styles.header}>
        <h4 className={styles.title}>{title || 'Notes'}</h4>
        <div className={styles.controls}>
          {/* Page Info */}
          <span className={styles.pageInfo}>
            {numPages ? `${numPages} pages` : '...'}
          </span>

          {/* Zoom Controls */}
          <div className={styles.zoomControls}>
            <button 
              className={styles.controlBtn}
              onClick={zoomOut}
              disabled={scale <= 0.5}
              title="Zoom Out"
            >
              <FiZoomOut size={16} />
            </button>
            <button 
              className={styles.zoomLevel}
              onClick={fitToWidth}
              title="Fit to Width"
            >
              {Math.round(scale * 100)}%
            </button>
            <button 
              className={styles.controlBtn}
              onClick={zoomIn}
              disabled={scale >= 2.5}
              title="Zoom In"
            >
              <FiZoomIn size={16} />
            </button>
          </div>

          <a 
            href={pdfUrl} 
            className={styles.controlBtn}
            download
            title="Download"
          >
            <FiDownload size={16} />
          </a>

          <button 
            className={styles.controlBtn}
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <FiMinimize size={16} /> : <FiMaximize size={16} />}
          </button>

          {onClose && (
            <button 
              className={styles.controlBtn}
              onClick={onClose}
              title="Close"
            >
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      {/* PDF Content - All Pages Continuous Scroll */}
      <div className={styles.content}>
        {isLoading && (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Loading PDF...</p>
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading=""
          className={styles.document}
        >
          {/* Render ALL pages for continuous scroll */}
          {numPages && Array.from({ length: numPages }, (_, index) => (
            <Page 
              key={`page_${index + 1}`}
              pageNumber={index + 1}
              width={containerWidth * scale}
              className={styles.page}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          ))}
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer;
