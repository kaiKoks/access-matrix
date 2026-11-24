import React, { useState, useMemo, useEffect } from 'react';
import { useMatrixStore } from '@/store/useMatrixStore';
import { useCatalogQuery, useCheckRowMutation } from '@/hooks/useMatrixQueries';
import { buildAllSocketCombinations } from '@/services/networkTester';
import { StatusBadge } from '@/components/StatusBadge';
import type { DynamicMatrixRow } from '@/types/matrix';
import {
  X,
  Play,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Terminal,
  AlertTriangle,
  Clock,
  Info,
  Loader2,
} from 'lucide-react';

type SocketFilterTab = 'all' | 'accessible' | 'blocked' | 'untestable';

export const RowDetailDrawer: React.FC = () => {
  const { data: catalog = [] } = useCatalogQuery();
  const checkRowMutation = useCheckRowMutation();

  const {
    selectedRowId,
    setSelectedRowId,
    activeSystemId,
    draftSheets,
  } = useMatrixStore();

  const [socketFilter, setSocketFilter] = useState<SocketFilterTab>('all');

  useEffect(() => {
    if (!selectedRowId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedRowId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRowId, setSelectedRowId]);

  const selectedRow: DynamicMatrixRow | null = useMemo(() => {
    if (!selectedRowId) return null;

    if (activeSystemId === 'DRAFT') {
      for (const sh of draftSheets) {
        const found = sh.rows.find((r) => r.__id === selectedRowId);
        if (found) return found;
      }
    }

    for (const sys of catalog) {
      for (const sh of sys.sheets) {
        const found = sh.rows.find((r) => r.__id === selectedRowId);
        if (found) return found;
      }
    }

    return null;
  }, [selectedRowId, activeSystemId, draftSheets, catalog]);

  if (!selectedRow) return null;

  const hasActualResults =
    Array.isArray(selectedRow.socketResults) && selectedRow.socketResults.length > 0;

  const displayedSockets = hasActualResults
    ? selectedRow.socketResults!
    : buildAllSocketCombinations(selectedRow);

  const openCount = displayedSockets.filter((s) => s.status === 'accessible').length;
  const blockedCount = displayedSockets.filter((s) => s.status === 'blocked').length;
  const untestableCount = displayedSockets.filter((s) => s.status === 'untestable').length;

  const filteredSockets = displayedSockets.filter((s) => {
    if (socketFilter === 'all') return true;
    return s.status === socketFilter;
  });

  const isChecking = selectedRow.checkStatus === 'checking';

  return (
    <aside className="w-107.5 shrink-0 bg-cool-gray-10/40 border-l border-rao-grey/20 flex flex-col h-full shadow-2xl z-30">
      <div className="px-5 py-4 border-b border-rao-grey/20 bg-cool-gray-10/70 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-white">
              Правило доступа #{selectedRow.__rowNumber}
            </h2>
            {selectedRow.__systemName && (
              <span className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-medium text-rao-grey border border-rao-grey/20">
                {selectedRow.__systemName}
              </span>
            )}
          </div>
          <p className="text-xs text-rao-grey mt-0.5">
            Детализация всех сетевых связок
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSelectedRowId(null)}
          className="p-1.5 rounded-lg text-rao-grey hover:text-white hover:bg-rao-blue/30 transition"
          title="Закрыть панель"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div className="space-y-2.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-rao-grey">
            Статус правила
          </div>

          <div className="p-3.5 rounded-xl bg-black/40 border border-rao-grey/20 flex items-center justify-between gap-2">
            <StatusBadge
              status={selectedRow.checkStatus}
              reason={selectedRow.meta.untestableReason}
              errorMessage={selectedRow.errorMessage}
              socketResults={selectedRow.socketResults}
            />

            {selectedRow.lastCheckedAt && (
              <span className="inline-flex items-center gap-1 text-[11px] text-rao-grey font-mono">
                <Clock className="w-3 h-3 text-rao-grey" />
                {selectedRow.lastCheckedAt}
              </span>
            )}
          </div>

          {selectedRow.errorMessage && (
            <div className="p-3.5 rounded-xl bg-brand-red/15 border border-brand-red/40 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-brand-red">
                <AlertTriangle className="w-3.5 h-3.5 text-brand-red shrink-0" />
                <span>Ошибка выполнения запроса</span>
              </div>
              <p className="text-cool-gray-1 leading-relaxed wrap-break-word">
                {selectedRow.errorMessage}
              </p>
            </div>
          )}

          {!selectedRow.meta.isTestable && selectedRow.meta.untestableReason && (
            <div className="p-3.5 rounded-xl bg-black/40 border border-rao-grey/20 text-xs flex items-start gap-2 text-rao-grey">
              <Info className="w-4 h-4 text-rao-grey shrink-0 mt-0.5" />
              <span className="leading-relaxed">{selectedRow.meta.untestableReason}</span>
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rao-grey">
              Связки IP × Порт ({displayedSockets.length})
            </span>

            {hasActualResults && (
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setSocketFilter('all')}
                  className={`px-2 py-0.5 rounded transition ${
                    socketFilter === 'all'
                      ? 'bg-rao-blue text-white font-medium border border-brand-cyan/50'
                      : 'text-rao-grey hover:text-white'
                  }`}
                >
                  Все ({displayedSockets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSocketFilter('accessible')}
                  className={`px-2 py-0.5 rounded transition ${
                    socketFilter === 'accessible'
                      ? 'bg-brand-green/25 text-brand-lightgreen font-medium border border-brand-green/40'
                      : 'text-rao-grey hover:text-brand-lightgreen'
                  }`}
                >
                  Открыты ({openCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSocketFilter('blocked')}
                  className={`px-2 py-0.5 rounded transition ${
                    socketFilter === 'blocked'
                      ? 'bg-brand-red/25 text-brand-red font-medium border border-brand-red/40'
                      : 'text-rao-grey hover:text-brand-red'
                  }`}
                >
                  Закрыты ({blockedCount})
                </button>
                {untestableCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setSocketFilter('untestable')}
                    className={`px-2 py-0.5 rounded transition ${
                      socketFilter === 'untestable'
                        ? 'bg-rao-blue/40 text-rao-grey font-medium border border-rao-grey/30'
                        : 'text-rao-grey hover:text-cool-gray-1'
                    }`}
                  >
                    Пропущено ({untestableCount})
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2 max-h-72.5 overflow-y-auto pr-1">
            {filteredSockets.length === 0 ? (
              <div className="p-4 rounded-xl bg-black/40 border border-rao-grey/20 text-center text-xs text-rao-grey">
                Нет связок для выбранного фильтра
              </div>
            ) : (
              filteredSockets.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl bg-black/40 border border-rao-grey/20 space-y-1.5 font-mono text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-cool-gray-10/50 text-cool-gray-1 text-[10px] font-semibold border border-rao-grey/20">
                      {s.protocol} : {s.port}
                    </span>

                    {!hasActualResults ? (
                      <span className="text-rao-grey font-sans text-[11px]">
                        {s.status === 'untestable' ? 'Пропущено' : 'Ожидает опроса'}
                      </span>
                    ) : s.status === 'accessible' ? (
                      <span className="text-brand-lightgreen flex items-center gap-1 font-sans text-[11px] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Доступен (lastvalue: 1)
                      </span>
                    ) : s.status === 'untestable' ? (
                      <span className="text-rao-grey flex items-center gap-1 font-sans text-[11px] font-medium">
                        Не проверялось
                      </span>
                    ) : (
                      <span className="text-brand-red flex items-center gap-1 font-sans text-[11px] font-medium">
                        <XCircle className="w-3.5 h-3.5" />
                        Закрыт (lastvalue: 0)
                      </span>
                    )}
                  </div>

                  <div className="text-cool-gray-1 break-all flex items-center gap-1.5 text-[11px]">
                    <span className="text-rao-grey">{s.source}</span>
                    <ArrowRight className="w-3 h-3 text-brand-cyan shrink-0" />
                    <span className="text-white font-medium">{s.destination}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[10px] text-rao-grey pt-0.5">
                    <span className="truncate" title={s.zabbixKey}>
                      Ключ: {s.zabbixKey}
                    </span>
                    <span className="shrink-0">
                      lastclock:{' '}
                      {hasActualResults && s.status !== 'untestable' && s.lastclock > 0
                        ? new Date(s.lastclock * 1000).toLocaleTimeString()
                        : '—'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-rao-grey">
            <Terminal className="w-3.5 h-3.5 text-brand-cyan" />
            <span>Лог проверки</span>
          </div>

          <pre className="p-3.5 rounded-xl bg-black/40 border border-rao-grey/20 text-[11px] font-mono text-brand-lightgreen whitespace-pre-wrap wrap-break-word max-h-48 overflow-y-auto leading-relaxed">
            {selectedRow.checkLog ||
              'Проверка для данного правила еще не запускалась. Нажмите «Запустить сетевой тест» ниже.'}
          </pre>
        </div>
      </div>

      <div className="p-4 border-t border-rao-grey/20 bg-cool-gray-10/70">
        <button
          type="button"
          disabled={!selectedRow.meta.isTestable || isChecking}
          onClick={() => checkRowMutation.mutate(selectedRow)}
          className="w-full py-2.5 px-4 rounded-xl bg-rao-orange hover:bg-rao-orange/85 disabled:bg-cool-gray-10/40 disabled:text-cool-gray-8 disabled:border disabled:border-rao-grey/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition shadow-md hover:shadow-rao-orange/20"
        >
          {isChecking ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Выполняется опрос Zabbix...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Запустить сетевой тест ({displayedSockets.length})</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
