import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

export type AlertType = 'success' | 'error' | 'info' | 'warning';

interface AlertState {
  title: string;
  message?: string;
  type: AlertType;
  visible: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface NotificationContextType {
  currentAlert: AlertState;
  alert: (title: string, message?: string, type?: AlertType, duration?: number) => void;
  confirm: (title: string, message?: string, onConfirm?: () => void, onCancel?: () => void, confirmText?: string, cancelText?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentAlert, setCurrentAlert] = useState<AlertState>({
    title: '',
    message: '',
    type: 'info',
    visible: false,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideAlert = useCallback(() => {
    setCurrentAlert(prev => ({ ...prev, visible: false }));
  }, []);

  const alert = useCallback((title: string, message?: string, type: AlertType = 'info', duration = 3000) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCurrentAlert({ title, message, type, visible: true });
    timeoutRef.current = setTimeout(hideAlert, duration);
  }, [hideAlert]);

  const confirm = useCallback((title: string, message?: string, onConfirm?: () => void, onCancel?: () => void, confirmText = 'Confirmer', cancelText = 'Annuler') => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setCurrentAlert({ title, message, type: 'warning', visible: true, onConfirm, onCancel, confirmText, cancelText });
  }, []);

  return (
    <NotificationContext.Provider value={{ currentAlert, alert, confirm }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
