import { useState } from 'react';
import { useNotifications } from './useNotifications';

export function useHUD() {
  const { notifications, addNotification } = useNotifications();
  
  const [dialog, setDialog] = useState<{ sender: string; text: string; id: string; lineIndex?: number; totalLines?: number } | null>(null);
  
  const [heroHp, setHeroHp] = useState(100);
  const [heroMaxHp, setHeroMaxHp] = useState(100);
  const [heroMp, setHeroMp] = useState(50);
  const [heroMaxMp, setHeroMaxMp] = useState(50);
  const [heroPrana, setHeroPrana] = useState(85);
  const [heroMaxPrana, setHeroMaxPrana] = useState(100);
  const [heroKarma, setHeroKarma] = useState(108);

  return {
    notifications,
    addNotification,
    dialog,
    setDialog,
    heroHp,
    setHeroHp,
    heroMaxHp,
    setHeroMaxHp,
    heroMp,
    setHeroMp,
    heroMaxMp,
    setHeroMaxMp,
    heroPrana,
    setHeroPrana,
    heroMaxPrana,
    setHeroMaxPrana,
    heroKarma,
    setHeroKarma
  };
}
