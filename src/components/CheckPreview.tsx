import { useState } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CheckPreviewProps {
  base64Data: string;
  title: string;
}

export function CheckPreview({ base64Data, title }: CheckPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="relative">
      <div
        className={`relative border rounded-lg overflow-hidden bg-white 
          ${isExpanded ? 'fixed inset-4 z-50 flex items-center justify-center' : 'h-48 w-full'}`}
      >
        <button
          onClick={toggleExpand}
          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-lg hover:bg-gray-100 z-10"
        >
          {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
        
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded text-sm font-medium">
          {title}
        </div>

        <img
          src={base64Data}
          alt={title}
          className={`object-contain ${isExpanded ? 'max-h-full max-w-full' : 'h-full w-full'}`}
        />
      </div>

      {isExpanded && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={toggleExpand}
        />
      )}
    </div>
  );
}
