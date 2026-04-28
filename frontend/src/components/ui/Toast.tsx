import React, { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose?: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const bgColors = {
    success: 'bg-gray-100 border-gray-300',
    error: 'bg-gray-100 border-gray-300',
    info: 'bg-gray-50 border-gray-200',
  };

  const textColors = {
    success: 'text-gray-900',
    error: 'text-gray-900',
    info: 'text-gray-800',
  };

  const icons = {
    success: 'OK',
    error: 'ERR',
    info: 'INFO',
  };

  return (
    <div className={`fixed bottom-4 right-4 border rounded-md p-4 ${bgColors[type]} ${textColors[type]} flex items-center gap-3 max-w-sm`}>
      <span className="text-xs font-bold tracking-wide">{icons[type]}</span>
      <p className="text-sm">{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose?.();
        }}
        className="ml-auto text-lg font-bold opacity-50 hover:opacity-100"
      >
        x
      </button>
    </div>
  );
};

export default Toast;
