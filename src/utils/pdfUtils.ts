import { PDFDocument } from 'pdf-lib';
import { PdfMetadata } from '../types';

export async function extractPdfMetadata(base64Pdf: string): Promise<PdfMetadata> {
  try {
    // Remove data URL prefix if present
    const pdfData = base64Pdf.replace(/^data:application\/pdf;base64,/, '');
    const pdfBytes = Uint8Array.from(atob(pdfData), c => c.charCodeAt(0));
    
    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    // Get the first page (assuming single-page checks)
    const pages = pdfDoc.getPages();
    const page = pages[0];
    const { width, height } = page.getSize();

    // Calculate file size
    const fileSizeBytes = pdfBytes.length;
    const fileSizeKB = (fileSizeBytes / 1024).toFixed(2);

    const metadata: PdfMetadata = {
      fileSize: `${fileSizeKB} KB`,
      dimensions: `${width.toFixed(0)}x${height.toFixed(0)}`,
      pageCount: pages.length,
      creator: pdfDoc.getCreator(),
      producer: pdfDoc.getProducer(),
      creationDate: pdfDoc.getCreationDate()?.toISOString()
    };

    return metadata;
  } catch (error) {
    console.error('Error extracting PDF metadata:', error);
    return {
      fileSize: 'Неизвестно',
      dimensions: 'Неизвестно',
      pageCount: 0
    };
  }
}
