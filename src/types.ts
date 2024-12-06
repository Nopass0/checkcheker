export interface BankTemplate {
  id: string;
  name: string;
  sampleCheck: string; // base64 PDF
  metadata: {
    bankName: string;
    checkFormat: string;
    dateAdded: string;
  };
}

export interface PdfMetadata {
  fileSize: string;
  dimensions: string;
  pageCount: number;
  creator?: string;
  producer?: string;
  creationDate?: string;
}

export interface VerificationResult {
  id: string;
  fileName: string;
  checkNumber: number;
  bankName: string;
  checkImage: string; // base64 PDF of verified check
  templateImage: string; // base64 PDF of template
  timestamp: string;
  score: number;
  metadata: {
    template: PdfMetadata;
    verified: PdfMetadata;
  };
  details: {
    fieldComparison: {
      [key: string]: {
        наличие: boolean;
        совпадение: boolean;
        комментарий: string;
      };
    };
    layoutMatch: string;
    securityFeatures: string;
    stampSignature: string;
    metadataComparison: string;
    overallAssessment: string;
    missingFields: string[];
  };
}
