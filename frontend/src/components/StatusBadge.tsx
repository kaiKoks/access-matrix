import React from 'react';
import type { NetworkCheckStatus, SocketCheckItem } from '@/types/matrix';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
  Ban,
  AlertTriangle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: NetworkCheckStatus;
  reason?: string;
  errorMessage?: string;
  socketResults?: SocketCheckItem[];
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  reason,
  errorMessage,
  socketResults,
}) => {
  const testableResults =
    socketResults?.filter((s) => s.status !== 'untestable') || [];
  const total = testableResults.length;
  const openCount = testableResults.filter((s) => s.status === 'accessible').length;
  const countLabel = total > 0 ? ` (${openCount}/${total})` : '';

  switch (status) {
    case 'checking':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-brand-cyan/20 text-brand-sky border border-brand-cyan/40">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Проверка...
        </span>
      );

    case 'accessible':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-brand-green/20 text-brand-lightgreen border border-brand-green/40">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Доступен{countLabel}
        </span>
      );

    case 'blocked':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-brand-red/20 text-brand-red border border-brand-red/40">
          <XCircle className="w-3.5 h-3.5" />
          Закрыт{countLabel}
        </span>
      );

    case 'error':
      return (
        <span
          title={errorMessage || 'Ошибка запроса к Zabbix API'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/40 cursor-help"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Ошибка API
        </span>
      );

    case 'untestable':
      return (
        <span
          title={reason || 'Автоматическая проверка недоступна'}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-cool-gray-10/50 text-rao-grey border border-rao-grey/20 cursor-help"
        >
          <Ban className="w-3.5 h-3.5" />
          Недоступно
        </span>
      );

    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap bg-cool-gray-10/30 text-cool-gray-4 border border-rao-grey/20">
          <Clock className="w-3.5 h-3.5" />
          Не проверялось
        </span>
      );
  }
};
