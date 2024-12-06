import { GoogleGenerativeAI } from '@google/generative-ai';
import { PdfMetadata } from '../types';

const genAI = new GoogleGenerativeAI('AIzaSyC91INRsX6FRSOAvC0i-noyiOsHD3tC7ZM');

interface AnalysisResult {
  score: number;
  полеСравнение: {
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
}

interface ComparisonMetadata {
  templateMetadata: PdfMetadata;
  verifiedMetadata: PdfMetadata;
}

const cleanJsonResponse = (text: string): string => {
  try {
    // Remove markdown code blocks
    let jsonText = text.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    
    // Find the JSON object boundaries
    const startIndex = jsonText.indexOf('{');
    const endIndex = jsonText.lastIndexOf('}');
    
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('No valid JSON object found in response');
    }
    
    // Extract just the JSON part
    jsonText = jsonText.slice(startIndex, endIndex + 1);

    // Basic JSON string cleanup
    jsonText = jsonText
      // Fix line breaks and whitespace
      .replace(/[\n\r\t]/g, ' ')
      .replace(/\s+/g, ' ')
      // Fix common JSON issues
      .replace(/([{,])\s*([a-zA-Zа-яА-Я_][a-zA-Zа-яА-Я0-9_]*)\s*:/g, '$1"$2":')
      .replace(/:\s*'([^']*)'/g, ':"$1"')
      .replace(/,\s*}/g, '}')
      .replace(/,\s*]/g, ']')
      .replace(/:\s*undefined/g, ':null');

    // Validate JSON structure
    JSON.parse(jsonText);
    return jsonText;
  } catch (error) {
    console.error('Error cleaning JSON:', error);
    throw new Error(`Failed to clean JSON response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

const sanitizeString = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value).trim();
};

const sanitizeBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const sanitizeNumber = (value: unknown): number => {
  if (typeof value === 'number') return Math.max(0, Math.min(100, value));
  if (typeof value === 'string') {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : Math.max(0, Math.min(100, num));
  }
  return 0;
};

const sanitizeArray = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.map(sanitizeString);
  if (typeof value === 'string') return [value];
  return [];
};

const validateAndSanitizeResponse = (parsed: any): AnalysisResult => {
  const sanitized: AnalysisResult = {
    score: sanitizeNumber(parsed.score),
    полеСравнение: {},
    layoutMatch: sanitizeString(parsed.layoutMatch || 'Анализ макета недоступен'),
    securityFeatures: sanitizeString(parsed.securityFeatures || 'Анализ защитных элементов недоступен'),
    stampSignature: sanitizeString(parsed.stampSignature || 'Анализ печатей и подписей недоступен'),
    metadataComparison: sanitizeString(parsed.metadataComparison || 'Анализ метаданных недоступен'),
    overallAssessment: sanitizeString(parsed.overallAssessment || 'Общая оценка недоступна'),
    missingFields: sanitizeArray(parsed.missingFields)
  };

  const fieldsComparison = parsed.fieldComparison || parsed.полеСравнение || {};
  
  for (const [key, value] of Object.entries(fieldsComparison)) {
    try {
      const fieldValue = typeof value === 'string' ? JSON.parse(value) : value;
      sanitized.полеСравнение[key] = {
        наличие: sanitizeBoolean(fieldValue?.наличие),
        совпадение: sanitizeBoolean(fieldValue?.совпадение),
        комментарий: sanitizeString(fieldValue?.комментарий || 'Комментарий отсутствует')
      };
    } catch (error) {
      console.error(`Error parsing field comparison for ${key}:`, error);
      sanitized.полеСравнение[key] = {
        наличие: false,
        совпадение: false,
        комментарий: 'Ошибка анализа поля'
      };
    }
  }

  return sanitized;
};

export async function compareChecks(
  sampleCheck: string,
  checkToVerify: string,
  bankMetadata: any,
  comparisonMetadata: ComparisonMetadata
): Promise<AnalysisResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Проведи детальный анализ и сравнение двух банковских чеков. Верни ответ в формате JSON.
    
    Метаданные образца чека:
    ${JSON.stringify(bankMetadata)}
    
    Метаданные PDF файлов:
    Образец: ${JSON.stringify(comparisonMetadata.templateMetadata)}
    Проверяемый: ${JSON.stringify(comparisonMetadata.verifiedMetadata)}
    
    Образец чека (base64): ${sampleCheck.substring(0, 100)}...
    Проверяемый чек (base64): ${checkToVerify.substring(0, 100)}...
    
    Структура JSON ответа:
    {
      "score": number от 0 до 100,
      "fieldComparison": {
        "название_поля": {
          "наличие": true/false,
          "совпадение": true/false,
          "комментарий": "текст"
        }
      },
      "missingFields": ["поле1", "поле2"],
      "stampSignature": "текст анализа",
      "metadataComparison": "текст анализа",
      "layoutMatch": "текст анализа",
      "securityFeatures": "текст анализа",
      "overallAssessment": "текст анализа"
    }

    ВАЖНО: Верни только JSON без дополнительного текста.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanedJson = cleanJsonResponse(text);
    const parsed = JSON.parse(cleanedJson);
    return validateAndSanitizeResponse(parsed);
  } catch (error) {
    console.error('Error during check comparison:', error);
    throw new Error(`Failed to compare checks: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
