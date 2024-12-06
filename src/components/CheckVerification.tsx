import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, Trash2, AlertCircle, Loader2, Building2, XCircle } from 'lucide-react';
import { getBankTemplates } from '../utils/storage';
import { compareChecks } from '../services/geminiService';
import { saveVerificationResult } from '../utils/storage';
import { extractPdfMetadata } from '../utils/pdfUtils';
import { VerificationResult, BankTemplate } from '../types';
import { CheckComparison } from './CheckComparison';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface FileStatus {
  file: File;
  status: 'pending' | 'processing' | 'success' | 'error';
  error?: string;
}

export function CheckVerification() {
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([]);
  const [processing, setProcessing] = useState(false);
  const [currentResults, setCurrentResults] = useState<VerificationResult[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    onDrop: (acceptedFiles) => {
      const newFiles = acceptedFiles.map(file => ({
        file,
        status: 'pending' as const
      }));
      setFileStatuses(prev => [...prev, ...newFiles]);
    }
  });

  const findBestMatchingTemplate = async (checkData: string): Promise<BankTemplate | null> => {
    const templates = getBankTemplates();
    if (templates.length === 0) return null;

    if (selectedBank) {
      return templates.find(t => t.name === selectedBank) || null;
    }

    let bestMatch: BankTemplate | null = null;
    let highestScore = -1;

    for (const template of templates) {
      try {
        const comparison = await compareChecks(
          template.sampleCheck,
          checkData,
          template.metadata,
          { 
            templateMetadata: await extractPdfMetadata(template.sampleCheck),
            verifiedMetadata: await extractPdfMetadata(checkData)
          }
        );

        if (comparison.score > highestScore) {
          highestScore = comparison.score;
          bestMatch = template;
        }
      } catch (error) {
        console.error(`Error comparing with template ${template.name}:`, error);
      }
    }

    return bestMatch;
  };

  const processFile = async (fileStatus: FileStatus): Promise<void> => {
    try {
      setFileStatuses(prev =>
        prev.map(fs =>
          fs.file === fileStatus.file
            ? { ...fs, status: 'processing' }
            : fs
        )
      );

      const reader = new FileReader();
      const filePromise = new Promise<VerificationResult>((resolve, reject) => {
        reader.onload = async (e) => {
          try {
            const checkToVerify = e.target?.result as string;
            const bestTemplate = await findBestMatchingTemplate(checkToVerify);

            if (!bestTemplate) {
              throw new Error('Не найден подходящий шаблон банка');
            }

            const verifiedMetadata = await extractPdfMetadata(checkToVerify);
            const templateMetadata = await extractPdfMetadata(bestTemplate.sampleCheck);
            
            const result = await compareChecks(
              bestTemplate.sampleCheck,
              checkToVerify,
              bestTemplate.metadata,
              { templateMetadata, verifiedMetadata }
            );

            const verificationResult = {
              id: Date.now().toString(),
              fileName: fileStatus.file.name,
              checkNumber: currentResults.length + 1,
              bankName: bestTemplate.name,
              checkImage: checkToVerify,
              templateImage: bestTemplate.sampleCheck,
              timestamp: new Date().toISOString(),
              score: result.score,
              metadata: {
                template: templateMetadata,
                verified: verifiedMetadata
              },
              details: {
                fieldComparison: result.полеСравнение,
                layoutMatch: result.layoutMatch,
                securityFeatures: result.securityFeatures,
                stampSignature: result.stampSignature,
                metadataComparison: result.metadataComparison,
                overallAssessment: result.overallAssessment,
                missingFields: result.missingFields
              }
            };

            resolve(verificationResult);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsDataURL(fileStatus.file);
      });

      const result = await filePromise;
      saveVerificationResult(result);
      setCurrentResults(prev => [...prev, result]);
      setFileStatuses(prev =>
        prev.map(fs =>
          fs.file === fileStatus.file
            ? { ...fs, status: 'success' }
            : fs
        )
      );
      toast.success(`Проверен чек: ${fileStatus.file.name}`);
    } catch (error) {
      console.error('Ошибка при обработке чека:', error);
      setFileStatuses(prev =>
        prev.map(fs =>
          fs.file === fileStatus.file
            ? { ...fs, status: 'error', error: error.message }
            : fs
        )
      );
      toast.error(`Ошибка при проверке чека ${fileStatus.file.name}: ${error.message}`);
    }
  };

  const processChecks = async () => {
    const bankTemplates = getBankTemplates();
    
    if (bankTemplates.length === 0) {
      toast.error('Добавьте хотя бы один шаблон банка для сравнения');
      return;
    }

    setProcessing(true);

    try {
      const pendingFiles = fileStatuses.filter(fs => fs.status === 'pending');
      await Promise.all(pendingFiles.map(processFile));
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Произошла ошибка при обработке файлов');
    } finally {
      setProcessing(false);
      // Clear processed files
      setFileStatuses(prev => prev.filter(fs => fs.status === 'pending'));
    }
  };

  const clearResults = () => {
    setCurrentResults([]);
    setFileStatuses([]);
  };

  const removeFile = (fileToRemove: FileStatus) => {
    setFileStatuses(prev => prev.filter(fs => fs.file !== fileToRemove.file));
  };

  const bankTemplates = getBankTemplates();

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4 bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Выберите банк (необязательно)
        </label>
        <select
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          className="w-full border rounded-md py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Автоматическое определение</option>
          {bankTemplates.map((template) => (
            <option key={template.id} value={template.name}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      <motion.div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${processing ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500 border-gray-300'}`}
        whileHover={!processing ? { scale: 1.02 } : {}}
        whileTap={!processing ? { scale: 0.98 } : {}}
      >
        <input {...getInputProps()} disabled={processing} />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-1 text-sm text-gray-600">
          {processing 
            ? 'Обработка файлов...' 
            : 'Перетащите чеки для проверки или нажмите для выбора'}
        </p>
      </motion.div>

      {fileStatuses.length > 0 && (
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="font-medium">Выбранные файлы:</h3>
          <div className="space-y-2">
            {fileStatuses.map((fileStatus, index) => (
              <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  {fileStatus.status === 'processing' && (
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                  )}
                  {fileStatus.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {fileStatus.status === 'error' && (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                  {fileStatus.status === 'pending' && (
                    <Building2 className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="text-sm">
                    {fileStatus.file.name}
                    {fileStatus.error && (
                      <span className="text-red-500 ml-2">- {fileStatus.error}</span>
                    )}
                  </span>
                </div>
                {fileStatus.status === 'pending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(fileStatus);
                    }}
                    className="p-1 hover:text-red-600"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
          
          <motion.button
            onClick={processChecks}
            disabled={processing || !fileStatuses.some(fs => fs.status === 'pending')}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {processing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Обработка...
              </span>
            ) : (
              'Проверить чеки'
            )}
          </motion.button>
        </motion.div>
      )}

      {currentResults.length > 0 && (
        <motion.div 
          className="space-y-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Результаты проверки:</h3>
            <motion.button
              onClick={clearResults}
              className="text-red-500 flex items-center gap-1 hover:text-red-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 size={16} />
              Очистить
            </motion.button>
          </div>
          
          <AnimatePresence>
            {currentResults.map((result) => (
              <CheckComparison key={result.id} result={result} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
