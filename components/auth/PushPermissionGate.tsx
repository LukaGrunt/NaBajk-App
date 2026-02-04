import React, { useState, useEffect } from 'react';
import { PushPermissionModal } from './PushPermissionModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface PushPermissionGateProps {
  children: React.ReactNode;
}

export function PushPermissionGate({ children }: PushPermissionGateProps) {
  const { user, pushPermissionAsked } = useAuth();
  const { language } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const modalLang = language === 'sl' ? 'SLO' : 'ENG';

  useEffect(() => {
    // Show modal if user is signed in and hasn't been asked yet
    if (user && !pushPermissionAsked) {
      // Small delay to let the user settle after sign-in
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, pushPermissionAsked]);

  return (
    <>
      {children}
      <PushPermissionModal
        visible={showModal}
        language={modalLang}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
