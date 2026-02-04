import React, { createContext, useState, useEffect, useContext } from 'react';
import { Language } from '@/constants/i18n';
import { getLanguage, setLanguage as saveLanguage } from '@/utils/localSettings';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'sl',
  setLanguage: async () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('sl');

  useEffect(() => {
    async function loadLanguage() {
      const lang = await getLanguage();
      setLanguageState(lang);
    }
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    await saveLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
