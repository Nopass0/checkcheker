import { AlertCircle, CheckCircle, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { VerificationResult } from '../types';
import { PdfViewer } from './PdfViewer';

interface CheckComparisonProps {
  result: VerificationResult;
}

export function CheckComparison({ result }: CheckComparisonProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="border rounded-lg p-6 space-y-6 bg-white shadow-sm"
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium flex items-center gap-2">
            <span>Чек №{result.checkNumber}</span>
            {result.score >= 80 ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
          </h4>
          <p className="text-sm text-gray-500 mt-1">{result.fileName}</p>
          <p className="text-sm font-medium mt-1">Банк: {result.bankName}</p>
        </div>
        <div className="text-right">
          <span className={`font-bold text-2xl ${getScoreColor(result.score)}`}>
            {result.score}%
          </span>
          <p className="text-sm text-gray-500 mt-1">Оценка соответствия</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h5 className="font-medium mb-3">Оригинал</h5>
          <PdfViewer data={result.templateImage} />
        </div>
        <div>
          <h5 className="font-medium mb-3">Проверяемый чек</h5>
          <PdfViewer data={result.checkImage} />
        </div>
      </div>

      <div className="space-y-6 bg-gray-50 p-6 rounded-lg">
        <div>
          <h5 className="text-lg font-semibold mb-4">Результаты анализа</h5>
          
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h6 className="font-medium mb-3 text-blue-600">Сравнение полей</h6>
              <div className="grid gap-3">
                {Object.entries(result.details.fieldComparison).map(([field, data]) => (
                  <div key={field} className="border rounded p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{field}</span>
                      <div className="flex gap-2">
                        {data.наличие && (
                          <span className="text-green-500 text-sm px-2 py-1 bg-green-50 rounded">
                            Присутствует
                          </span>
                        )}
                        {data.совпадение && (
                          <span className="text-blue-500 text-sm px-2 py-1 bg-blue-50 rounded">
                            Совпадает
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{data.комментарий}</p>
                  </div>
                ))}
              </div>
            </div>

            {result.details.missingFields.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h6 className="font-medium mb-3 text-red-600">Отсутствующие поля</h6>
                <div className="space-y-2">
                  {result.details.missingFields.map((field, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span>{field}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h6 className="font-medium mb-3 text-blue-600">Печати и подписи</h6>
              <p className="text-gray-700 whitespace-pre-line">{result.details.stampSignature}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h6 className="font-medium mb-3 text-blue-600">Метаданные файла</h6>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Размер файла</p>
                    <p className="font-medium">
                      {result.metadata.verified.fileSize}
                      <span className="text-gray-500 text-sm ml-2">
                        (оригинал: {result.metadata.template.fileSize})
                      </span>
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Размеры страницы</p>
                    <p className="font-medium">
                      {result.metadata.verified.dimensions}
                      <span className="text-gray-500 text-sm ml-2">
                        (оригинал: {result.metadata.template.dimensions})
                      </span>
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t">
                  <p className="text-gray-700 whitespace-pre-line">{result.details.metadataComparison}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h6 className="font-medium mb-3 text-blue-600">Анализ макета</h6>
              <p className="text-gray-700 whitespace-pre-line">{result.details.layoutMatch}</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h6 className="font-medium mb-3 text-blue-600">Защитные элементы</h6>
              <p className="text-gray-700 whitespace-pre-line">{result.details.securityFeatures}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <h6 className="font-medium text-lg mb-3 text-gray-900">Общее заключение</h6>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-gray-800 whitespace-pre-line leading-relaxed">
              {result.details.overallAssessment}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
