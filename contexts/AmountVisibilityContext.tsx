'use client';

import React, { createContext, useContext, useState } from 'react';

interface AmountVisibilityContextType {
  isVisible: boolean;
  toggleVisibility: () => void;
}

const AmountVisibilityContext = createContext<AmountVisibilityContextType | undefined>(undefined);

export function AmountVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <AmountVisibilityContext.Provider value={{ isVisible, toggleVisibility }}>
      {children}
    </AmountVisibilityContext.Provider>
  );
}

export function useAmountVisibility() {
  const context = useContext(AmountVisibilityContext);
  if (context === undefined) {
    throw new Error('useAmountVisibility must be used within an AmountVisibilityProvider');
  }
  return context;
}
