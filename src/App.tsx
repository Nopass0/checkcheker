import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/Tabs';
import { BankTemplateForm } from './components/BankTemplateForm';
import { CheckVerification } from './components/CheckVerification';
import { VerificationHistory } from './components/VerificationHistory';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('verify');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">Проверка чеков</h1>
          <p className="text-gray-600 mt-2">Верификация чеков с помощью ИИ</p>
        </motion.header>

        <Tabs value={activeTab} onChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="verify">Проверка чеков</TabsTrigger>
            <TabsTrigger value="banks">Шаблоны банков</TabsTrigger>
            <TabsTrigger value="history">История</TabsTrigger>
          </TabsList>

          <TabsContent value="verify">
            <CheckVerification />
          </TabsContent>

          <TabsContent value="banks">
            <BankTemplateForm />
          </TabsContent>

          <TabsContent value="history">
            <VerificationHistory />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
