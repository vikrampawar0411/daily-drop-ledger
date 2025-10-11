import { createContext, useContext, useState } from 'react';

interface GuestContextType {
  isGuestMode: boolean;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
}

const GuestContext = createContext<GuestContextType | undefined>(undefined);

export const GuestProvider = ({ children }: { children: React.ReactNode }) => {
  const [isGuestMode, setIsGuestMode] = useState(false);

  const enableGuestMode = () => {
    setIsGuestMode(true);
    localStorage.setItem('guestMode', 'true');
  };

  const disableGuestMode = () => {
    setIsGuestMode(false);
    localStorage.removeItem('guestMode');
  };

  return (
    <GuestContext.Provider value={{ isGuestMode, enableGuestMode, disableGuestMode }}>
      {children}
    </GuestContext.Provider>
  );
};

export const useGuest = () => {
  const context = useContext(GuestContext);
  if (context === undefined) {
    throw new Error('useGuest must be used within a GuestProvider');
  }
  return context;
};
