import React, { useRef, useState, useEffect } from 'react';
import { useMatrixStore } from '@/store/useMatrixStore';
import {
  useCatalogQuery,
  useFoldersQuery,
  useSaveSystemMutation,
  useDeleteSystemMutation,
  useCheckBatchMutation,
} from '@/hooks/useMatrixQueries';
import { parseExcelMatrix } from '@/services/excelParser';
import { exportFilteredGroupsToExcel } from '@/services/networkTester';
import { getFolderPath, getFolderBreadcrumbString } from '@/utils/folderTree';
import type { SavedMatrixSystem, DetectedColumn } from '@/types/matrix';
import { AesLogo } from '@/components/AesLogo';
import {
  Upload,
  Play,
  Search,
  Layers,
  Download,
  Save,
  Database,
  Check,
  AtSign,
  Trash2,
  AlertTriangle,
  X,
  FilePlus2,
  Pencil,
  SlidersHorizontal,
  PanelLeft,
  ChevronRight,
  Folder,
} from 'lucide-react';
import {
  formatMatrixTag,
  parseSearchInput,
  buildVisibleMatrixGroups,
  SYNTAX_SHORTCUTS,
} from '@/utils/matrixFilter';

export const Toolbar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mentionMenuRef = useRef<HTMLDivElement>(null);
  const syntaxMenuRef = useRef<HTMLDivElement>(null);

  const [justSaved, setJustSaved] = useState(false);

  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState<number>(0);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [syntaxHelpOpen, setSyntaxHelpOpen] = useState(false);

  const { data: catalog = [] } = useCatalogQuery();
  const { data: folders = [] } = useFoldersQuery();
  const saveMutation = useSaveSystemMutation();
  const deleteMutation = useDeleteSystemMutation();
  const batchCheckMutation = useCheckBatchMutation();

  const {
    activeSystemId,
    activeFolderId,
    isSidebarOpen,
    toggleSidebar,
    draftFolderId,
    setDraftFolderId,
    setActiveFolderId,
    draftName,
    draftSheets,
    activeSheetIndex,
    searchQuery,
    columnFilter,
    statusFilter,
    isEditMode,
    hasUnsavedChanges,
    uiError,
    setDraftMatrix,
    createNewEmptyMatrix,
    setDraftName,
    selectSystem,
    setActiveSheetIndex,
    setSearchQuery,
    setStatusFilter,
    setIsEditMode,
    setUiError,
  } = useMatrixStore();

  const { matrixTags } = parseSearchInput(searchQuery);
  const isMultiMatrixMode = activeSystemId === 'ALL' || matrixTags.length > 0;

  const currentSystem = catalog.find((c) => c.id === activeSystemId);
  const singleSystemSheets =
    activeSystemId === 'DRAFT' ? draftSheets : currentSystem ? currentSystem.sheets : [];

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

  const allVisibleRows = visibleGroups.flatMap((g) => g.rows);
  const testableCount = allVisibleRows.filter((r) => r.meta.isTestable).length;

  const availableColumns: DetectedColumn[] = [];
  const seenTitles = new Set<string>();
  visibleGroups.forEach((g) => {
    g.columns.forEach((c) => {
      if (!seenTitles.has(c.headerTitle)) {
        seenTitles.add(c.headerTitle);
        availableColumns.push(c);
      }
    });
  });

  const qNormalized = mentionQuery.toLowerCase().replace(/_/g, ' ');
  const filteredMentions = mentionOpen
    ? catalog.filter(
        (sys) =>
          sys.name.toLowerCase().includes(qNormalized) ||
          formatMatrixTag(sys.name).toLowerCase().includes(mentionQuery.toLowerCase())
      )
    : [];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        mentionMenuRef.current &&
        !mentionMenuRef.current.contains(target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(target)
      ) {
        setMentionOpen(false);
      }
      if (
        syntaxMenuRef.current &&
        !syntaxMenuRef.current.contains(target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(target)
      ) {
        setSyntaxHelpOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUiError(null);
      const parsed = await parseExcelMatrix(file);
      if (parsed.length === 0) {
        setUiError('В выбранном Excel-файле не найдено таблиц с правилами доступа');
        return;
      }
      setDraftMatrix(file.name, parsed);
    } catch (err: any) {
      setUiError(err?.message || 'Ошибка при чтении Excel-файла');
    }
    e.target.value = '';
  };

  const handleSaveToBackend = async () => {
    const targetName =
      activeSystemId === 'DRAFT'
        ? (draftName || 'Новая матрица').trim()
        : currentSystem?.name || 'Матрица';
    const targetSheets =
      activeSystemId === 'DRAFT' ? draftSheets : currentSystem?.sheets || [];
    const targetFolderId =
      activeSystemId === 'DRAFT' ? draftFolderId : currentSystem?.folderId;

    if (!targetSheets.length) return;
    try {
      await saveMutation.mutateAsync({
        name: targetName,
        sheets: targetSheets,
        folderId: targetFolderId,
      });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch {
      // Ошибка отображается через uiError
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart ?? val.length;
    setSearchQuery(val);

    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/(?:^|\s)@([^\s@]*)$/);

    if (match) {
      const atIndex = textBeforeCursor.lastIndexOf('@');
      setMentionOpen(true);
      setSyntaxHelpOpen(false);
      setMentionQuery(match[1]);
      setMentionStartPos(atIndex);
      setSelectedIndex(0);
    } else {
      setMentionOpen(false);
    }
  };

  const insertMention = (sys: SavedMatrixSystem) => {
    const input = searchInputRef.current;
    const tag = `@${formatMatrixTag(sys.name)} `;
    const cursorPos = input?.selectionStart ?? searchQuery.length;

    const before = searchQuery.slice(0, mentionStartPos);
    const after = searchQuery.slice(cursorPos);
    const nextValue = `${before}${tag}${after}`;

    setSearchQuery(nextValue);
    setMentionOpen(false);

    setTimeout(() => {
      if (input) {
        input.focus();
        const newCursor = before.length + tag.length;
        input.setSelectionRange(newCursor, newCursor);
      }
    }, 0);
  };

  const insertSyntaxToken = (token: string) => {
    const input = searchInputRef.current;
    const trimmed = searchQuery.trimEnd();
    const nextValue = trimmed ? `${trimmed} ${token}` : token;
    setSearchQuery(nextValue);
    setSyntaxHelpOpen(false);

    setTimeout(() => {
      if (input) {
        input.focus();
        input.setSelectionRange(nextValue.length, nextValue.length);
      }
    }, 0);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mentionOpen || filteredMentions.length === 0) {
      if (e.key === 'Escape') setSyntaxHelpOpen(false);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredMentions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredMentions.length) % filteredMentions.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      insertMention(filteredMentions[selectedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setMentionOpen(false);
    }
  };

  const handleExport = () => {
    if (visibleGroups.length === 0) return;
    const prefix =
      visibleGroups.length === 1 ? visibleGroups[0].systemName : 'Сводный_отчет_матриц';
    exportFilteredGroupsToExcel(visibleGroups, prefix);
  };

  return (
    <div className="bg-cool-gray-10/40 border-b border-rao-grey/20 shrink-0">
      <div className="px-6 py-2.5 space-y-2.5">
        {/* Фирменная шапка: Официальный логотип АО «Алтайэнергосбыт» и статус */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-rao-grey/20">
          <div className="flex items-center gap-3.5">
            <AesLogo />
            <div className="hidden sm:block h-7 w-px bg-rao-grey/30" />
            <div className="hidden sm:flex flex-col">
              <span className="text-[12px] font-bold tracking-wide text-white uppercase">
                Служба управления матрицами сетевого доступа
              </span>
              <span className="text-[10px] text-rao-grey">
                Контур информационной безопасности и сетевой инфраструктуры
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-cool-gray-10/60 border border-rao-grey/20 text-rao-grey">
              <span className="w-2 h-2 rounded-full bg-brand-green shadow-xs" />
              <span className="text-[11px] font-medium text-cool-gray-1">Сервер подключен</span>
            </div>
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cool-gray-10/60 border border-rao-grey/20 text-[11px] text-rao-grey">
              <span>Матриц в каталоге:</span>
              <span className="text-white font-mono font-bold">{catalog.length}</span>
            </div>
          </div>
        </div>

        {/* Панель оперативного управления */}
        <div className="flex flex-col xl:flex-row gap-3 items-center justify-between">
          {/* Левая часть: каталог, загрузка, создание с нуля, сохранение */}
          <div className="flex items-center gap-2 xl:w-auto flex-wrap">
            <button
              type="button"
              onClick={toggleSidebar}
              className={`p-1.5 rounded-lg border transition ${
                isSidebarOpen
                  ? 'bg-cool-gray-10/80 text-white border-rao-grey/40 hover:bg-cool-gray-10'
                  : 'bg-cool-gray-10/50 text-rao-grey hover:text-white border-rao-grey/20 hover:border-brand-cyan'
              }`}
              title={isSidebarOpen ? 'Скрыть боковую панель каталога' : 'Показать дерево папок'}
            >
              <PanelLeft className="w-4 h-4" />
            </button>

            {activeSystemId !== 'ALL' && activeSystemId !== 'DRAFT' && currentSystem && (
              <button
                onClick={() => deleteMutation.mutate(activeSystemId)}
                title="Удалить матрицу с бэкенда"
                className="p-2 rounded-lg bg-cool-gray-10/50 hover:bg-brand-red/20 text-rao-grey hover:text-brand-red border border-rao-grey/20 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cool-gray-10/50 hover:bg-cool-gray-10 text-cool-gray-1 text-xs font-medium border border-rao-grey/20 hover:border-brand-cyan transition"
            >
              <Upload className="w-3.5 h-3.5 text-brand-cyan" />
              Открыть (.xlsx)
            </button>

            <button
              onClick={() => createNewEmptyMatrix('Новая матрица')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cool-gray-10/50 hover:bg-cool-gray-10 text-brand-lightgreen text-xs font-medium border border-rao-grey/20 hover:border-brand-green transition"
              title="Создать и заполнить новую матрицу прямо в программе"
            >
              <FilePlus2 className="w-3.5 h-3.5 text-brand-lightgreen" />
              Создать матрицу
            </button>

            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                isEditMode
                  ? 'bg-rao-orange/20 text-rao-orange border-rao-orange/60'
                  : 'bg-cool-gray-10/50 hover:bg-cool-gray-10 text-cool-gray-1 border border-rao-grey/20'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              {isEditMode ? 'Режим правки: ВКЛ' : 'Редактировать'}
            </button>

            {(activeSystemId === 'DRAFT' || hasUnsavedChanges) &&
              (draftSheets.length > 0 || currentSystem) && (
                <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-rao-orange/40">
                  {activeSystemId === 'DRAFT' && (
                    <>
                      <input
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        placeholder="Имя матрицы..."
                        className="px-2.5 py-1 bg-transparent text-xs text-white focus:outline-none w-32"
                      />
                      <select
                        value={draftFolderId || ''}
                        onChange={(e) => setDraftFolderId(e.target.value || null)}
                        className="px-2 py-1 bg-cool-gray-10/80 border border-rao-grey/20 text-[11px] text-cool-gray-1 rounded focus:outline-none max-w-32 truncate"
                        title="Папка для сохранения матрицы"
                      >
                        <option value="" className="bg-cool-gray-10 text-white">📁 Корень</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id} className="bg-cool-gray-10 text-white">
                            📁 {getFolderBreadcrumbString(folders, f.id)}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                  <button
                    disabled={saveMutation.isPending}
                    onClick={handleSaveToBackend}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-rao-orange hover:bg-rao-orange/90 text-white text-xs font-semibold transition disabled:opacity-50 shadow-sm"
                  >
                    {justSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Сохранено
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        {saveMutation.isPending ? 'Сохранение...' : 'Сохранить на бэк'}
                      </>
                    )}
                  </button>
                </div>
              )}

            {!isMultiMatrixMode && singleSystemSheets.length > 1 && (
              <div className="flex items-center gap-1.5 bg-black/60 p-1 rounded-lg border border-rao-grey/20">
                <Layers className="w-4 h-4 text-rao-grey ml-1.5" />
                {singleSystemSheets.map((s, idx) => (
                  <button
                    key={s.sheetName}
                    onClick={() => setActiveSheetIndex(idx)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                      activeSheetIndex === idx
                        ? 'bg-rao-blue text-white border border-brand-cyan/50'
                        : 'text-rao-grey hover:text-white'
                    }`}
                  >
                    {s.sheetName}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Правая часть: умный поиск по столбцам, статус и экспорт */}
          <div className="flex items-center gap-2 w-full xl:w-auto justify-end flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2 text-rao-grey pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Поиск: src:10.194 dst:sber tcp:443 @матрица..."
                value={searchQuery}
                onChange={handleSearchChange}
                onKeyDown={handleSearchKeyDown}
                className="pl-9 pr-14 py-1.5 bg-black/60 border border-rao-grey/20 rounded-lg text-xs text-cool-gray-1 placeholder-cool-gray-4 focus:outline-none focus:border-brand-cyan w-80 font-mono"
              />

              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-0.5 text-rao-grey hover:text-white"
                    title="Очистить поиск"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSyntaxHelpOpen((prev) => !prev);
                    setMentionOpen(false);
                  }}
                  title="Фильтры по столбцам (src:, dst:, tcp:, udp:, role:)"
                  className={`p-0.5 rounded transition ${
                    syntaxHelpOpen
                      ? 'text-brand-cyan bg-brand-cyan/15'
                      : 'text-rao-grey hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Меню быстрых префиксов столбцов */}
              {syntaxHelpOpen && (
                <div
                  ref={syntaxMenuRef}
                  className="absolute right-0 top-full mt-1.5 w-80 bg-cool-gray-10 border border-rao-grey/30 rounded-lg shadow-2xl z-50 p-2.5 space-y-2"
                >
                  <div className="flex items-center justify-between text-[11px] text-rao-grey border-b border-rao-grey/20 pb-1.5">
                    <span className="font-medium text-white">Фильтр по столбцам</span>
                    <span className="text-[10px] text-rao-grey font-mono">
                      , = ИЛИ &nbsp;|&nbsp; - = НЕ
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1">
                    {SYNTAX_SHORTCUTS.map((item) => (
                      <button
                        key={item.token}
                        type="button"
                        onClick={() => insertSyntaxToken(item.token)}
                        className="flex flex-col px-2 py-1.5 rounded bg-black/80 hover:bg-rao-blue/40 border border-rao-grey/20 text-left transition"
                      >
                        <span className="text-[11px] font-mono font-semibold text-brand-cyan">
                          {item.token}
                        </span>
                        <span className="text-[10px] text-rao-grey truncate">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {availableColumns.length > 0 && (
                    <div className="pt-1 border-t border-rao-grey/20 space-y-1">
                      <div className="text-[10px] text-rao-grey">Столбцы таблицы:</div>
                      <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                        {availableColumns.map((col) => {
                          const shortHeader = col.headerTitle.split(/[\s(]/)[0];
                          const prefix = `${shortHeader}:`;
                          return (
                            <button
                              key={col.headerTitle}
                              type="button"
                              onClick={() => insertSyntaxToken(prefix)}
                              className="px-2 py-0.5 rounded bg-black/80 hover:bg-rao-blue/40 border border-rao-grey/20 text-[10px] text-cool-gray-1 truncate max-w-full transition"
                              title={`Искать в столбце «${col.headerTitle}»`}
                            >
                              {col.headerTitle}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Меню выбора @матрицы */}
              {mentionOpen && (
                <div
                  ref={mentionMenuRef}
                  className="absolute left-0 top-full mt-1.5 w-72 bg-cool-gray-10 border border-rao-grey/30 rounded-lg shadow-2xl z-50 overflow-hidden"
                >
                  <div className="px-3 py-1.5 bg-black/80 border-b border-rao-grey/20 flex items-center justify-between text-[11px] text-rao-grey">
                    <span className="flex items-center gap-1 font-medium text-white">
                      <AtSign className="w-3 h-3 text-brand-cyan" />
                      Выберите матрицу
                    </span>
                    <span className="text-[10px] text-cool-gray-4">↑↓ Enter</span>
                  </div>

                  {filteredMentions.length > 0 ? (
                    <div className="max-h-56 overflow-y-auto p-1">
                      {filteredMentions.map((sys, idx) => {
                        const isActive = idx === selectedIndex;
                        const rulesCount = sys.sheets.reduce((acc, s) => acc + s.rows.length, 0);
                        return (
                          <button
                            key={sys.id}
                            type="button"
                            onMouseEnter={() => setSelectedIndex(idx)}
                            onClick={() => insertMention(sys)}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs text-left transition ${
                              isActive
                                ? 'bg-rao-blue text-white border border-brand-cyan/50'
                                : 'text-cool-gray-1 hover:bg-rao-blue/30'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <span className="font-mono font-medium">
                                @{formatMatrixTag(sys.name)}
                              </span>
                              <span
                                className={`block text-[10px] truncate ${
                                  isActive ? 'text-brand-sky' : 'text-rao-grey'
                                }`}
                              >
                                {sys.name}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
                                isActive
                                  ? 'bg-rao-blue/80 text-white'
                                  : 'bg-black/60 text-rao-grey'
                              }`}
                            >
                              {rulesCount} пр.
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-xs text-rao-grey">
                      Матрица не найдена
                    </div>
                  )}
                </div>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-black/60 border border-rao-grey/20 rounded-lg text-xs text-cool-gray-1 focus:outline-none focus:border-brand-cyan cursor-pointer"
            >
              <option value="all" className="bg-cool-gray-10 text-white">Все статусы</option>
              <option value="accessible" className="bg-cool-gray-10 text-brand-lightgreen">Доступен</option>
              <option value="blocked" className="bg-cool-gray-10 text-brand-red">Закрыт</option>
              <option value="error" className="bg-cool-gray-10 text-brand-yellow">Ошибка API</option>
              <option value="untestable" className="bg-cool-gray-10 text-rao-grey">Недоступно</option>
              <option value="idle" className="bg-cool-gray-10 text-cool-gray-4">Не проверен</option>
            </select>

            {allVisibleRows.length > 0 && (
              <>
                <button
                  onClick={handleExport}
                  title="Экспортировать текущую (отфильтрованную) таблицу в Excel"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cool-gray-10/50 hover:bg-cool-gray-10 text-cool-gray-1 text-xs font-medium border border-rao-grey/20 hover:border-brand-cyan transition"
                >
                  <Download className="w-3.5 h-3.5 text-brand-cyan" />
                  Экспорт ({allVisibleRows.length})
                </button>

                <button
                  disabled={batchCheckMutation.isPending || testableCount === 0}
                  onClick={() => batchCheckMutation.mutate(allVisibleRows)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rao-orange hover:bg-rao-orange/90 text-white text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-rao-orange/20"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {batchCheckMutation.isPending
                    ? 'Проверка...'
                    : `Проверить (${testableCount})`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Хлебные крошки (Breadcrumbs) текущей навигации */}
        <div className="flex items-center gap-1.5 text-xs text-rao-grey pt-1.5 border-t border-rao-grey/20 overflow-x-auto">
          <span className="text-rao-grey font-medium shrink-0">Путь:</span>
          <button
            type="button"
            onClick={() => {
              setActiveFolderId('ALL');
              selectSystem('ALL');
            }}
            className={`hover:text-white transition shrink-0 ${
              activeFolderId === 'ALL' && activeSystemId === 'ALL'
                ? 'text-white font-semibold'
                : 'text-cool-gray-4'
            }`}
          >
            Все матрицы
          </button>

          {activeFolderId !== 'ALL' && (
            <>
              <ChevronRight className="w-3 h-3 text-cool-gray-8 shrink-0" />
              {activeFolderId === null ? (
                <span className="text-white font-medium shrink-0">Корень</span>
              ) : (
                getFolderPath(folders, activeFolderId).map((f, idx, arr) => (
                  <React.Fragment key={f.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveFolderId(f.id);
                        if (activeSystemId !== 'ALL' && currentSystem?.folderId !== f.id) {
                          selectSystem('ALL');
                        }
                      }}
                      className={`hover:text-white transition flex items-center gap-1 shrink-0 ${
                        idx === arr.length - 1 && activeSystemId === 'ALL'
                          ? 'text-white font-semibold'
                          : 'text-cool-gray-4'
                      }`}
                    >
                      <Folder className="w-3 h-3 text-rao-orange" />
                      <span>{f.name}</span>
                    </button>
                    {idx < arr.length - 1 && (
                      <ChevronRight className="w-3 h-3 text-cool-gray-8 shrink-0" />
                    )}
                  </React.Fragment>
                ))
              )}
            </>
          )}

          {activeSystemId !== 'ALL' && (
            <>
              <ChevronRight className="w-3 h-3 text-cool-gray-8 shrink-0" />
              <span className="text-white font-semibold flex items-center gap-1 truncate">
                <Database className="w-3 h-3 text-brand-cyan shrink-0" />
                <span className="truncate">
                  {activeSystemId === 'DRAFT' ? `Черновик: ${draftName}` : currentSystem?.name}
                </span>
              </span>
            </>
          )}
        </div>

        {uiError && (
          <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg bg-brand-red/15 border border-brand-red/40 text-brand-red text-xs">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-brand-red shrink-0" />
              <span>{uiError}</span>
            </div>
            <button
              onClick={() => setUiError(null)}
              className="p-0.5 hover:bg-brand-red/20 rounded text-brand-red"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
