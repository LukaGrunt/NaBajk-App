import React, { createContext, useState, useEffect, useContext } from 'react';
import { RiderLevel } from '@/constants/i18n';
import { getRiderLevel, setRiderLevel as saveRiderLevel } from '@/utils/localSettings';

interface RiderLevelContextType {
  riderLevel: RiderLevel;
  setRiderLevel: (level: RiderLevel) => Promise<void>;
}

const RiderLevelContext = createContext<RiderLevelContextType>({
  riderLevel: 'intermediate',
  setRiderLevel: async () => {},
});

export function RiderLevelProvider({ children }: { children: React.ReactNode }) {
  const [riderLevel, setRiderLevelState] = useState<RiderLevel>('intermediate');

  useEffect(() => {
    async function load() {
      const level = await getRiderLevel();
      setRiderLevelState(level);
    }
    load();
  }, []);

  const setRiderLevel = async (level: RiderLevel) => {
    setRiderLevelState(level);
    await saveRiderLevel(level);
  };

  return (
    <RiderLevelContext.Provider value={{ riderLevel, setRiderLevel }}>
      {children}
    </RiderLevelContext.Provider>
  );
}

export function useRiderLevel() {
  return useContext(RiderLevelContext);
}
