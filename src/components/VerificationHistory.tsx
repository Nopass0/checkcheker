import { useEffect, useState } from 'react';
import { getVerificationHistory } from '../utils/storage';
import { VerificationResult } from '../types';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function VerificationHistory() {
  const [history, setHistory] = useState<VerificationResult[]>([]);

  useEffect(() => {
    setHistory(getVerificationHistory());
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU');
  };

  return (
    <div className="space-y-4">
      <motion.h2 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xl font-semibold"
      >
        История проверок
      </motion.h2>
      
      {history.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 text-gray-500"
        >
          История проверок пуста
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {history.map((result) => (
              <motion.div 
                key={result.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="border rounded-lg p-4 space-y-2 bg-white"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {result.score >= 80 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                    <span className="font-medium">{result.fileName}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(result.timestamp)}
                  </span>
                </div>
                
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Банк: {result.bankName}
                  </span>
                  <span className={`font-bold ${getScoreColor(result.score)}`}>
                    Оценка: {result.score}%
                  </span>
                </div>
                
                <div className="text-sm text-gray-600">
                  <p>{result.details.overallAssessment}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
