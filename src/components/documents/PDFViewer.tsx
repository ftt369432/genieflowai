import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import Skeleton from '../ui/Skeleton';
import { Button } from '../ui/Button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  url: string;
  className?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, className }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.min(Math.max(1, newPageNumber), numPages);
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  const zoomIn = () => setScale(prevScale => Math.min(prevScale + 0.2, 3));
  const zoomOut = () => setScale(prevScale => Math.max(prevScale - 0.2, 0.5));

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex justify-between items-center mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
        <div className="flex items-center">
          <Button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            size="sm"
            variant="ghost"
            className="mr-2"
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="text-sm">
            Page {pageNumber} of {numPages}
          </span>
          <Button
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            size="sm"
            variant="ghost"
            className="ml-2"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
        <div className="flex items-center">
          <Button onClick={zoomOut} size="sm" variant="ghost" className="mr-2">
            <ZoomOut size={16} />
          </Button>
          <span className="text-sm">{Math.round(scale * 100)}%</span>
          <Button onClick={zoomIn} size="sm" variant="ghost" className="ml-2">
            <ZoomIn size={16} />
          </Button>
        </div>
      </div>

      <div className="flex justify-center bg-gray-50 dark:bg-gray-900 rounded-md border p-4 overflow-auto">
        {isLoading && <Skeleton className="w-full h-[600px]" />}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={(error) => console.error('Error loading PDF:', error)}
          loading={<Skeleton className="w-full h-[600px]" />}
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFViewer; 