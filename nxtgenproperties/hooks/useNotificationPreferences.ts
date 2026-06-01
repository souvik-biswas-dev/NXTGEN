import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

export type NotificationPrefs = {
  matched: boolean;
  new_launches: boolean;
  property_news: boolean;
  price_drop: boolean;
};

const DEFAULTS: NotificationPrefs = {
  matched: true,
  new_launches: false,
  property_news: false,
  price_drop: true,
};

/**
 * Loads notification toggles from `user_preferences.notifications` JSONB
 * and persists with a 400 ms debounce so flipping multiple switches in a
 * row only hits the DB once.
 */
export function useNotificationPreferences() {
  const user = useAuthStore((s) => s.user);
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.user_id) {
        setLoading(false);
        return;
      }
      try {
        const { notifications } = await api.get<{ notifications: NotificationPrefs | null }>(
          '/notifications/prefs'
        );
        if (cancelled) return;
        if (notifications) setPrefs({ ...DEFAULTS, ...notifications });
      } catch {
        /* keep defaults */
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.user_id]);

  const persist = useCallback(
    (next: NotificationPrefs) => {
      if (!user?.user_id) return;
      void api.put('/notifications/prefs', next).catch(() => {});
    },
    [user?.user_id]
  );

  const update = useCallback(
    (partial: Partial<NotificationPrefs>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...partial };
        if (saveTimer.current) clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => persist(next), 400);
        return next;
      });
    },
    [persist]
  );

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  return { prefs, loading, update };
}
