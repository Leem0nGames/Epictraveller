'use client';
import React, { useState, useEffect } from 'react';
import { EventBus } from '../Core/EventBus';

export const ToastNotification: React.FC = () => {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (msg: string) => {
      setMessage(msg);
      setTimeout(() => setMessage(null), 3000);
    };
    EventBus.getInstance().on('toast:show', handler);
    return () => EventBus.getInstance().off('toast:show', handler);
  }, []);

  if (!message) return null;

  return (
    <div className="absolute top-4 left-0 right-0 z-[100] flex justify-center pointer-events-none">
      <div className="bg-emerald-600 text-white px-4 py-2 rounded-full shadow-lg animate-fade-in-up">
        {message}
      </div>
    </div>
  );
};
