import { useEffect, useRef } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface PdfViewerProps {
  data: string;
}

export function PdfViewer({ data }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    // Create embed element
    const embed = document.createElement('embed');
    embed.src = data;
    embed.type = 'application/pdf';
    embed.style.width = '100%';
    embed.style.height = '400px';
    
    container.appendChild(embed);
  }, [data]);

  return (
    <div ref={containerRef} className="border rounded overflow-hidden bg-gray-100">
      {/* PDF will be embedded here */}
    </div>
  );
}
