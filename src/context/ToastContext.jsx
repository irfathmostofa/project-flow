import { createContext, useContext, useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";

const ToastContext = createContext({});

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(
    ({ message, type = "info", duration = 5000, position = "top-right" }) => {
      const id = uuidv4();

      setToasts((prevToasts) => [
        ...prevToasts,
        {
          id,
          message,
          type,
          duration,
          position,
          createdAt: Date.now(),
        },
      ]);

      // Auto remove toast after duration
      if (duration !== 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    []
  );

  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const success = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: "success", ...options });
    },
    [addToast]
  );

  const error = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: "error", ...options });
    },
    [addToast]
  );

  const warning = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: "warning", ...options });
    },
    [addToast]
  );

  const info = useCallback(
    (message, options = {}) => {
      return addToast({ message, type: "info", ...options });
    },
    [addToast]
  );

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
};
