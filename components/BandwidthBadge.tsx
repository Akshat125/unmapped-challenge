'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/lib/i18n';
import { Badge } from './ui/Badge';

type ConnType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

interface NetworkInformation {
  effectiveType?: ConnType;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

function readConn(): ConnType {
  const nav = navigator as Navigator & { connection?: NetworkInformation };
  return nav.connection?.effectiveType ?? 'unknown';
}

export function BandwidthBadge() {
  const t = useT();
  const [online, setOnline] = useState(true);
  const [conn, setConn] = useState<ConnType>('unknown');

  useEffect(() => {
    setOnline(navigator.onLine);
    setConn(readConn());

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onChange = () => setConn(readConn());

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    const nav = navigator as Navigator & { connection?: NetworkInformation };
    nav.connection?.addEventListener?.('change', onChange);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
      nav.connection?.removeEventListener?.('change', onChange);
    };
  }, []);

  if (!online) {
    return (
      <Badge variant="tampered">
        <span aria-hidden>●</span> {t('bandwidth.offline')}
      </Badge>
    );
  }

  const isLow = conn === 'slow-2g' || conn === '2g' || conn === '3g';
  if (!isLow) return null;

  return (
    <Badge variant="demand">
      <span aria-hidden>●</span> {t('bandwidth.low')}
    </Badge>
  );
}
