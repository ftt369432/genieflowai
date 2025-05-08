import * as pdfjs from 'pdfjs-dist';
import { Document, Packer, Paragraph } from 'docx';
import Tesseract from 'tesseract.js';

// Initialize pdfjs worker
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
if (typeof window !== 'undefined') { // Ensure this runs only in the browser
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

/**
 * Document Processing Service
 * 
 * Handles extraction of text and data from various document types.
 */
export class DocumentProcessingService {
  /**
   * Extract text from a PDF file
   */
  async extractTextFromPDF(file: File | Blob): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return 'Error extracting text from PDF. The file may be damaged or encrypted.';
    }
  }

  /**
   * Extract text from a Word document
   */
  async extractTextFromWord(file: File | Blob): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await this.parseDocx(arrayBuffer);
      return result;
    } catch (error) {
      console.error('Error extracting text from Word document:', error);
      return 'Error extracting text from Word document. The file may be damaged or in an unsupported format.';
    }
  }

  /**
   * Extract text from an image using OCR
   */
  async extractTextFromImage(file: File | Blob): Promise<string> {
    try {
      const result = await Tesseract.recognize(
        file,
        'eng',
        { logger: m => console.log(m) }
      );
      
      return result.data.text;
    } catch (error) {
      console.error('Error extracting text from image via OCR:', error);
      return 'Error performing OCR on image. The image may be low quality or contain no recognizable text.';
    }
  }

  /**
   * Parse DOCX file - this is a simplified version, in a real app would 
   * use a more robust DOCX parsing library
   */
  private async parseDocx(arrayBuffer: ArrayBuffer): Promise<string> {
    try {
      // This is a placeholder for actual DOCX parsing
      // In a full implementation, we would use a proper docx parsing library
      const textEncoder = new TextDecoder("utf-8");
      const text = textEncoder.decode(arrayBuffer);
      
      // Very simplistic extraction - only works with basic docx
      // Find text sections marked by <w:t> tags
      let result = '';
      const regex = /<w:t(?:\s[^>]*)?>(.*?)<\/w:t>/g;
      let match;
      
      while ((match = regex.exec(text)) !== null) {
        result += match[1] + ' ';
      }
      
      return result || 'No text content found in the document';
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      return 'Error parsing DOCX file content';
    }
  }

  /**
   * Detect document type and extract text
   */
  async extractText(file: File): Promise<string> {
    const fileType = file.type.toLowerCase();
    const fileName = file.name.toLowerCase();
    
    // PDF files
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      return this.extractTextFromPDF(file);
    }
    
    // Word documents
    if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        fileType === 'application/msword' ||
        fileName.endsWith('.docx') || 
        fileName.endsWith('.doc')) {
      return this.extractTextFromWord(file);
    }
    
    // Image files for OCR
    if (fileType.startsWith('image/') || 
        ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].some(ext => fileName.endsWith(ext))) {
      return this.extractTextFromImage(file);
    }
    
    // Fallback for text files
    if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      return await file.text();
    }
    
    return 'Unsupported file type for text extraction';
  }
}

// Export a singleton instance
export const documentProcessingService = new DocumentProcessingService(); 