"use client";

import { createContext, useContext, useState, useRef, useCallback } from "react";

interface LoginDialogContextValue {
  isOpen: boolean;
  openLoginDialog: (onSuccess?: () => void) => void;
  closeLoginDialog: () => void;
  onLoginSuccess: () => void;
}

const LoginDialogContext = createContext<LoginDialogContextValue>({
  isOpen: false,
  openLoginDialog: () => {},
  closeLoginDialog: () => {},
  onLoginSuccess: () => {},
});

export function LoginDialogProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const onSuccessRef = useRef<(() => void) | undefined>();

  const openLoginDialog = useCallback((onSuccess?: () => void) => {
    onSuccessRef.current = onSuccess;
    setIsOpen(true);
  }, []);

  const closeLoginDialog = useCallback(() => {
    setIsOpen(false);
    onSuccessRef.current = undefined;
  }, []);

  const onLoginSuccess = useCallback(() => {
    setIsOpen(false);
    onSuccessRef.current?.();
    onSuccessRef.current = undefined;
  }, []);

  return (
    <LoginDialogContext.Provider value={{ isOpen, openLoginDialog, closeLoginDialog, onLoginSuccess }}>
      {children}
    </LoginDialogContext.Provider>
  );
}

export function useLoginDialog() {
  return useContext(LoginDialogContext);
}
