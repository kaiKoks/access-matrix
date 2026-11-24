import React, { useState, useRef } from 'react';
import { useMatrixStore } from '@/store/useMatrixStore';
import {
  useCatalogQuery,
  useFoldersQuery,
  useCheckRowMutation,
  useMatrixEditorActions,
  useMoveSystemMutation,
} from '@/hooks/useMatrixQueries';
import type { DetectedColumn, MatrixViewGroup, SavedMatrixSystem } from '@/types/matrix';
import { StatusBadge } from '@/components/StatusBadge';
import { PortCell } from '@/components/PortCell';
import { EndpointCell } from '@/components/EndpointCell';
import { buildVisibleMatrixGroups } from '@/utils/matrixFilter';
import { getFolderBreadcrumbString } from '@/utils/folderTree';
import { MoveMatrixModal } from '@/components/MoveMatrixModal';
import {
  Play,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Database,
  Folder,
  FolderInput,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  X,
} from 'lucide-react';

interface SortConfig {
  groupId: string;
  key: string;
  direction: 'asc' | 'desc';
}

function isColumnCentered(col: DetectedColumn): boolean {
  return (
    col.semanticRole === 'index' ||
    col.semanticRole === 'protocol' ||
    col.semanticRole === 'term' ||
    col.semanticRole === 'port' ||
    col.semanticRole === 'port_tcp' ||
    col.semanticRole === 'port_udp'
  );
}

// Контейнер таблицы с поддержкой Grab (Drag-to-Scroll)
const GrabScrollTable: React.FC<{
  children: React.ReactNode;
  onDragStateChange?: (moved: boolean) => void;
}> = ({ children, onDragStateChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isGrabbing, setIsGrabbing] = useState(false);

  const dragInfo = useRef({
    isDown: false,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
    moved: false,
  });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, select, button, a')) return;

    const container = containerRef.current;
    if (!container) return;

    dragInfo.current = {
      isDown: true,
      startX: e.pageX - container.offsetLeft,
      startY: e.pageY - container.offsetTop,
      scrollLeft: container.scrollLeft,
      scrollTop: container.scrollTop,
      moved: false,
    };
    onDragStateChange?.(false);
    setIsGrabbing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!dragInfo.current.isDown || !containerRef.current) return;

    const container = containerRef.current;
    const x = e.pageX - container.offsetLeft;
    const y = e.pageY - container.offsetTop;
    const walkX = x - dragInfo.current.startX;
    const walkY = y - dragInfo.current.startY;

    if (Math.abs(walkX) > 5 || Math.abs(walkY) > 5) {
      dragInfo.current.moved = true;
      onDragStateChange?.(true);
    }

    if (dragInfo.current.moved) {
      e.preventDefault();
      container.scrollLeft = dragInfo.current.scrollLeft - walkX;
      container.scrollTop = dragInfo.current.scrollTop - walkY;
    }
  };

  const stopDragging = () => {
    if (dragInfo.current.isDown) {
      dragInfo.current.isDown = false;
      setIsGrabbing(false);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDragging}
      onMouseLeave={stopDragging}
      className={`overflow-auto max-h-[calc(100vh-175px)] ${
        isGrabbing ? 'cursor-grabbing select-none' : 'cursor-grab'
      }`}
    >
      {children}
    </div>
  );
};

export const MatrixTable: React.FC = () => {
  const {
    data: catalog = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useCatalogQuery();
  const { data: folders = [] } = useFoldersQuery();
  const checkRowMutation = useCheckRowMutation();
  const moveSystemMutation = useMoveSystemMutation();
  const {
    updateCellValue,
    addRowToGroup,
    deleteRowFromGroup,
    addColumnToGroup,
    deleteColumnFromGroup,
    renameColumnInGroup,
  } = useMatrixEditorActions();

  const {
    activeSystemId,
    activeFolderId,
    draftName,
    draftSheets,
    activeSheetIndex,
    searchQuery,
    columnFilter,
    statusFilter,
    selectedRowId,
    isEditMode,
    setSelectedRowId,
    setIsEditMode,
    createNewEmptyMatrix,
  } = useMatrixStore();

  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Состояние перемещения матрицы в папку
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [matrixToMove, setMatrixToMove] = useState<SavedMatrixSystem | null>(null);

  // Состояние для превращения кнопки "+ Столбец" в поле ввода
  const [addingColGroupId, setAddingColGroupId] = useState<string | null>(null);
  const [newColTitle, setNewColTitle] = useState('');

  // Состояние для переименования существующего столбца
  const [renamingCol, setRenamingCol] = useState<{
    groupId: string;
    colKey: string;
    title: string;
  } | null>(null);

  const wasDraggedRef = useRef(false);

  const visibleGroups = buildVisibleMatrixGroups({
    catalog,
    folders,
    activeFolderId,
    activeSystemId,
    draftName,
    draftSheets,
    activeSheetIndex,
    searchQuery,
    columnFilter,
    statusFilter,
  });

  const handleSort = (groupId: string, key: string) => {
    setSortConfig((prev) => {
      if (prev?.groupId === groupId && prev.key === key) {
        return prev.direction === 'asc' ? { groupId, key, direction: 'desc' } : null;
      }
      return { groupId, key, direction: 'asc' };
    });
  };

  const submitNewColumn = (systemId: string | undefined, sheetName: string) => {
    if (newColTitle.trim()) {
      addColumnToGroup(systemId, sheetName, newColTitle);
    }
    setNewColTitle('');
    setAddingColGroupId(null);
  };

  const submitRenameColumn = (
    systemId: string | undefined,
    sheetName: string,
    colKey: string
  ) => {
    if (renamingCol && renamingCol.title.trim()) {
      renameColumnInGroup(systemId, sheetName, colKey, renamingCol.title);
    }
    setRenamingCol(null);
  };

  if (isError && activeSystemId !== 'DRAFT') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
        <div className="max-w-md bg-cool-gray-10/40 border border-brand-red/40 rounded-xl p-6 space-y-3 shadow-xl">
          <AlertTriangle className="w-8 h-8 text-brand-red mx-auto" />
          <h3 className="text-sm font-bold text-white">
            Ошибка подключения к серверу бэкенда
          </h3>
          <p className="text-xs text-rao-grey leading-relaxed">
            {(error as Error)?.message || 'Сервер http://localhost:3000 не отвечает.'}
          </p>
          <div className="flex items-center justify-center gap-2 pt-1">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cool-gray-10/50 hover:bg-cool-gray-10 text-cool-gray-1 text-xs font-medium border border-rao-grey/20 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Повторить
            </button>
            <button
              onClick={() => createNewEmptyMatrix('Локальная матрица')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rao-orange hover:bg-rao-orange/90 text-white text-xs font-bold transition shadow-sm"
            >
              Создать матрицу локально
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && activeSystemId !== 'DRAFT') {
    return (
      <div className="flex-1 flex items-center justify-center text-rao-grey text-xs">
        Загрузка каталога матриц с сервера...
      </div>
    );
  }

  if (visibleGroups.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-rao-grey p-12 space-y-3">
        <p className="text-sm text-cool-gray-1">
          Нет отображаемых правил (каталог пуст или не найдено совпадений по фильтру)
        </p>
        <button
          onClick={() => createNewEmptyMatrix('Новая матрица')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rao-orange hover:bg-rao-orange/90 text-white text-xs font-bold transition shadow-md"
        >
          <Plus className="w-4 h-4" />
          Создать и заполнить матрицу с нуля
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-6">
      {visibleGroups.map((group: MatrixViewGroup) => {
        const sortedRows =
          sortConfig && sortConfig.groupId === group.groupId
            ? [...group.rows].sort((a, b) => {
                const aVal = String(a.rawValues[sortConfig.key] ?? '');
                const bVal = String(b.rawValues[sortConfig.key] ?? '');
                const cmp = aVal.localeCompare(bVal, 'ru', { numeric: true });
                return sortConfig.direction === 'asc' ? cmp : -cmp;
              })
            : group.rows;

        const groupSystemId =
          activeSystemId === 'DRAFT'
            ? 'DRAFT'
            : sortedRows[0]?.__systemId || activeSystemId;

        const totalTableCols = group.columns.length + 3 + (isEditMode ? 1 : 0);

        return (
          <div
            key={group.groupId}
            className="bg-cool-gray-10/30 border border-rao-grey/20 rounded-xl shadow-md overflow-hidden flex flex-col"
          >
            {/* Шапка карточки матрицы */}
            <div className="px-4 py-2.5 bg-cool-gray-10/50 border-b border-rao-grey/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Database className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                <span className="text-xs font-bold text-white">{group.systemName}</span>
                <span className="text-xs text-cool-gray-4">/ {group.sheetName}</span>
                {group.folderId ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] bg-cool-gray-10/70 text-cool-gray-1 border border-rao-grey/20">
                    <Folder className="w-3 h-3 text-rao-orange" />
                    <span>{getFolderBreadcrumbString(folders, group.folderId)}</span>
                  </span>
                ) : null}
              </div>

              {groupSystemId !== 'DRAFT' && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      const sys = catalog.find(
                        (s) => s.id === groupSystemId || s.name === group.systemName
                      );
                      if (sys) {
                        setMatrixToMove(sys);
                        setMoveModalOpen(true);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] text-cool-gray-1 hover:text-white bg-black/40 hover:bg-cool-gray-10/60 border border-rao-grey/20 hover:border-brand-cyan transition"
                    title="Переместить в другую папку..."
                  >
                    <FolderInput className="w-3 h-3 text-brand-lightgreen" />
                    <span>В папку...</span>
                  </button>
                </div>
              )}
            </div>

            <GrabScrollTable
              onDragStateChange={(moved) => {
                wasDraggedRef.current = moved;
              }}
            >
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-cool-gray-10/70 backdrop-blur-xs sticky top-0 z-20 border-b border-rao-grey/20 text-cool-gray-4 font-semibold shadow-xs">
                  <tr>
                    <th className="py-2.5 px-4 w-12 text-center text-cool-gray-4">№</th>
                    <th className="py-2.5 px-4 w-44 whitespace-nowrap text-center text-cool-gray-1">Статус доступа</th>
                    {group.columns.map((col) => {
                      const isSorted =
                        sortConfig?.groupId === group.groupId && sortConfig.key === col.key;
                      const centered = isColumnCentered(col);
                      const isRenamingThis =
                        renamingCol?.groupId === group.groupId &&
                        renamingCol?.colKey === col.key;

                      return (
                        <th
                          key={col.key}
                          className={`py-2.5 px-4 whitespace-nowrap group ${
                            centered ? 'text-center' : 'text-left'
                          }`}
                        >
                          {isEditMode ? (
                            <div className="inline-flex items-center gap-1.5 bg-black/60 border border-rao-grey/20 rounded-md px-2 py-1">
                              {isRenamingThis ? (
                                <input
                                  type="text"
                                  autoFocus
                                  value={renamingCol.title}
                                  onChange={(e) =>
                                    setRenamingCol({
                                      ...renamingCol,
                                      title: e.target.value,
                                    })
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      submitRenameColumn(
                                        groupSystemId,
                                        group.sheetName,
                                        col.key
                                      );
                                    } else if (e.key === 'Escape') {
                                      setRenamingCol(null);
                                    }
                                  }}
                                  onBlur={() =>
                                    submitRenameColumn(
                                      groupSystemId,
                                      group.sheetName,
                                      col.key
                                    )
                                  }
                                  className="bg-transparent text-xs text-white focus:outline-none w-32"
                                />
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setRenamingCol({
                                      groupId: group.groupId,
                                      colKey: col.key,
                                      title: col.headerTitle,
                                    })
                                  }
                                  title="Нажмите, чтобы переименовать столбец"
                                  className="text-cool-gray-1 hover:text-brand-cyan transition font-medium"
                                >
                                  {col.headerTitle}
                                </button>
                              )}

                              {group.columns.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteColumnFromGroup(
                                      groupSystemId,
                                      group.sheetName,
                                      col.key
                                    )
                                  }
                                  title={`Удалить столбец «${col.headerTitle}»`}
                                  className="p-0.5 rounded hover:bg-brand-red/20 text-cool-gray-4 hover:text-brand-red transition"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => handleSort(group.groupId, col.key)}
                              className={`inline-flex items-center gap-1.5 hover:text-white transition font-semibold ${
                                centered ? 'justify-center mx-auto' : 'text-left'
                              }`}
                            >
                              <span>{col.headerTitle}</span>
                              {isSorted ? (
                                sortConfig.direction === 'asc' ? (
                                  <ArrowUp className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                                ) : (
                                  <ArrowDown className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                                )
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-40 shrink-0" />
                              )}
                            </button>
                          )}
                        </th>
                      );
                    })}

                    {/* Интерактивная ячейка "+ Столбец", превращающаяся в поле ввода при клике */}
                    {isEditMode && (
                      <th className="py-2 px-3 whitespace-nowrap w-44 align-middle">
                        {addingColGroupId === group.groupId ? (
                          <div className="inline-flex items-center gap-1 bg-black/60 border border-brand-cyan rounded-md px-2 py-1">
                            <input
                              type="text"
                              autoFocus
                              value={newColTitle}
                              onChange={(e) => setNewColTitle(e.target.value)}
                              placeholder="Название столбца..."
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  submitNewColumn(groupSystemId, group.sheetName);
                                } else if (e.key === 'Escape') {
                                  setAddingColGroupId(null);
                                  setNewColTitle('');
                                }
                              }}
                              className="bg-transparent text-xs text-white focus:outline-none w-32 font-normal"
                            />
                            <button
                              type="button"
                              onClick={() => submitNewColumn(groupSystemId, group.sheetName)}
                              className="p-0.5 text-brand-lightgreen hover:bg-brand-green/20 rounded"
                              title="Добавить (Enter)"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setAddingColGroupId(null);
                                setNewColTitle('');
                              }}
                              className="p-0.5 text-cool-gray-4 hover:text-white rounded"
                              title="Отмена (Esc)"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAddingColGroupId(group.groupId);
                              setNewColTitle('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-dashed border-rao-grey/30 hover:border-brand-cyan text-rao-grey hover:text-brand-cyan hover:bg-brand-cyan/10 text-xs font-normal transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Столбец</span>
                          </button>
                        )}
                      </th>
                    )}

                    <th className="py-3 px-4 w-24 text-center">Действия</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-rao-grey/15 text-cool-gray-1">
                  {sortedRows.map((row, index) => {
                    const isSelected = row.__id === selectedRowId;
                    const prevSection =
                      index > 0 ? sortedRows[index - 1].__sectionTitle : undefined;
                    const showSectionBanner =
                      row.__sectionTitle && row.__sectionTitle !== prevSection;

                    return (
                      <React.Fragment key={row.__id}>
                        {showSectionBanner && (
                          <tr className="bg-cool-gray-10/70 border-y border-rao-grey/25">
                            <td
                              colSpan={totalTableCols}
                              className="py-2 px-4 font-bold text-cool-gray-1 tracking-wider uppercase text-[11px] text-center"
                            >
                              <span className="inline-flex items-center gap-2">
                                <span className="h-px w-6 bg-rao-grey/30" />
                                {row.__sectionTitle}
                                <span className="h-px w-6 bg-rao-grey/30" />
                              </span>
                            </td>
                          </tr>
                        )}
                        <tr
                          onClick={() => {
                            if (wasDraggedRef.current) return;
                            setSelectedRowId(row.__id);
                          }}
                          onDoubleClick={() => setIsEditMode(true)}
                          className={`transition ${
                            isSelected
                              ? 'bg-cool-gray-10/70 border-l-2 border-rao-orange'
                              : 'hover:bg-cool-gray-10/35'
                          }`}
                        >
                          <td className="py-2.5 px-4 text-center font-mono text-cool-gray-4 align-middle">
                            {row.__rowNumber}
                          </td>
                          <td className="py-2.5 px-4 text-center align-middle whitespace-nowrap">
                            <StatusBadge
                              status={row.checkStatus}
                              reason={row.meta.untestableReason}
                              errorMessage={row.errorMessage}
                              socketResults={row.socketResults}
                            />
                          </td>
                          {group.columns.map((col) => {
                            const val = row.rawValues[col.key];
                            const isEndpoint =
                              col.semanticRole === 'source' ||
                              col.semanticRole === 'destination';
                            const isPort =
                              col.semanticRole === 'port_tcp' ||
                              col.semanticRole === 'port_udp' ||
                              col.semanticRole === 'port';
                            const centered = isColumnCentered(col);

                            return (
                              <td
                                key={col.key}
                                className={`py-2.5 px-3 min-w-35 max-w-md align-middle ${
                                  centered ? 'text-center' : 'text-left'
                                }`}
                              >
                                {isEditMode ? (
                                  <input
                                    type="text"
                                    value={String(val ?? '')}
                                    onChange={(e) =>
                                      updateCellValue(row.__id, col.key, e.target.value)
                                    }
                                    placeholder={col.headerTitle}
                                    className="w-full px-2 py-1.5 bg-black/60 border border-rao-grey/20 rounded text-xs text-white focus:outline-none focus:border-brand-cyan"
                                  />
                                ) : isEndpoint ? (
                                  <EndpointCell value={val} />
                                ) : isPort ? (
                                  <PortCell
                                    value={val}
                                    isTcp={col.semanticRole === 'port_tcp'}
                                    isUdp={col.semanticRole === 'port_udp'}
                                    dictionary={group.portDictionary}
                                  />
                                ) : (
                                  <span className="leading-relaxed">{String(val ?? '—')}</span>
                                )}
                              </td>
                            );
                          })}

                          {/* Пустая ячейка под кнопкой "+ Столбец" в режиме редактирования */}
                          {isEditMode && <td className="py-2.5 px-3" />}

                          <td
                            className="py-2.5 px-4 text-center align-middle"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="inline-flex items-center gap-1">
                              <button
                                disabled={
                                  !row.meta.isTestable || row.checkStatus === 'checking'
                                }
                                onClick={() => checkRowMutation.mutate(row)}
                                title={
                                  row.meta.untestableReason || 'Проверить доступность правила'
                                }
                                className="p-1.5 rounded-lg bg-cool-gray-10/50 hover:bg-brand-cyan text-cool-gray-1 hover:text-white border border-rao-grey/20 transition disabled:opacity-20 disabled:pointer-events-none"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                              </button>

                              {isEditMode && (
                                <button
                                  onClick={() => deleteRowFromGroup(row.__id)}
                                  title="Удалить строку"
                                  className="p-1.5 rounded-lg bg-cool-gray-10/50 hover:bg-brand-red text-cool-gray-4 hover:text-white border border-rao-grey/20 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}

                  {/* Нижняя строка добавления нового правила (в стиле Notion / Linear) */}
                  <tr className="bg-cool-gray-10/20 hover:bg-cool-gray-10/40 transition">
                    <td colSpan={totalTableCols} className="p-0">
                      <button
                        type="button"
                        onClick={() => {
                          addRowToGroup(groupSystemId, group.sheetName);
                          if (!isEditMode) setIsEditMode(true);
                        }}
                        className="w-full py-2.5 px-4 flex items-center gap-2 text-xs text-rao-grey hover:text-brand-lightgreen font-medium transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Добавить правило доступа</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </GrabScrollTable>
          </div>
        );
      })}

      {matrixToMove && (
        <MoveMatrixModal
          isOpen={moveModalOpen}
          onClose={() => {
            setMoveModalOpen(false);
            setMatrixToMove(null);
          }}
          matrix={matrixToMove}
          folders={folders}
          onMove={async (systemId, folderId) => {
            await moveSystemMutation.mutateAsync({ systemId, folderId });
          }}
        />
      )}
    </div>
  );
};