import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Trash2, Edit2, Save } from 'lucide-react';
import { getBankTemplates, saveBankTemplate, deleteBankTemplate } from '../utils/storage';
import { BankTemplate } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export function BankTemplateForm() {
  const [bankName, setBankName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [templates, setTemplates] = useState<BankTemplate[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    setTemplates(getBankTemplates());
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0]);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !bankName) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        
        const template = {
          id: Date.now().toString(),
          name: bankName,
          sampleCheck: base64,
          metadata: {
            bankName,
            checkFormat: 'standard',
            dateAdded: new Date().toISOString()
          }
        };

        saveBankTemplate(template);
        setTemplates(getBankTemplates());
        toast.success('Шаблон банка успешно сохранен');
        setBankName('');
        setFile(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Не удалось сохранить шаблон банка');
    }
  };

  const handleDelete = (id: string) => {
    deleteBankTemplate(id);
    setTemplates(getBankTemplates());
    toast.success('Шаблон удален');
  };

  const handleEdit = (template: BankTemplate) => {
    setEditingId(template.id);
    setEditName(template.name);
  };

  const handleSaveEdit = (id: string) => {
    const updatedTemplates = templates.map(template =>
      template.id === id ? { ...template, name: editName } : template
    );
    localStorage.setItem('check-guardian-banks', JSON.stringify(updatedTemplates));
    setTemplates(updatedTemplates);
    setEditingId(null);
    toast.success('Шаблон обновлен');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Название банка</label>
          <input
            type="text"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div {...getRootProps()} className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500">
          <input {...getInputProps()} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-1 text-sm text-gray-600">
            {file ? file.name : 'Перетащите образец чека (PDF) или нажмите для выбора'}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={!file || !bankName}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          Добавить шаблон банка
        </motion.button>
      </form>

      <div className="space-y-4">
        <h3 className="font-medium text-lg">Существующие шаблоны</h3>
        <AnimatePresence>
          {templates.map((template) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex items-center justify-between p-4 bg-white rounded-lg shadow"
            >
              {editingId === template.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="border rounded px-2 py-1"
                  autoFocus
                />
              ) : (
                <span>{template.name}</span>
              )}
              
              <div className="flex gap-2">
                {editingId === template.id ? (
                  <button
                    onClick={() => handleSaveEdit(template.id)}
                    className="p-1 hover:text-blue-600"
                  >
                    <Save size={20} />
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-1 hover:text-blue-600"
                  >
                    <Edit2 size={20} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-1 hover:text-red-600"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
