import { BankTemplate, VerificationResult } from '../types';

export const storageKeys = {
  bankTemplates: 'check-guardian-banks',
  verificationHistory: 'check-guardian-history'
};

export const getBankTemplates = (): BankTemplate[] => {
  const stored = localStorage.getItem(storageKeys.bankTemplates);
  return stored ? JSON.parse(stored) : [];
};

export const saveBankTemplate = (template: BankTemplate) => {
  const current = getBankTemplates();
  localStorage.setItem(storageKeys.bankTemplates, JSON.stringify([...current, template]));
};

export const deleteBankTemplate = (id: string) => {
  const current = getBankTemplates();
  const updated = current.filter(template => template.id !== id);
  localStorage.setItem(storageKeys.bankTemplates, JSON.stringify(updated));
};

export const getVerificationHistory = (): VerificationResult[] => {
  const stored = localStorage.getItem(storageKeys.verificationHistory);
  return stored ? JSON.parse(stored) : [];
};

export const saveVerificationResult = (result: VerificationResult) => {
  const current = getVerificationHistory();
  const monthAgo = new Date();
  monthAgo.setMonth(monthAgo.getMonth() - 1);
  
  const filtered = current.filter(item => 
    new Date(item.timestamp) > monthAgo
  );
  
  localStorage.setItem(
    storageKeys.verificationHistory, 
    JSON.stringify([...filtered, result])
  );
};
