import React, { createContext, useContext } from 'react';

export const OnboardingTriggerContext = createContext<() => void>(() => {});

export function useShowOnboarding() {
  return useContext(OnboardingTriggerContext);
}
