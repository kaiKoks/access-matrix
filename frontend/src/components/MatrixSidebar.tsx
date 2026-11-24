import React, { useState } from 'react';
import { useMatrixStore } from '@/store/useMatrixStore';
import {
  useFoldersQuery,
  useCatalogQuery,
  useCreateFolderMutation,
  useUpdateFolderMutation,
  useDeleteFolderMutation,
  useMoveSystemMutation,
  useDeleteSystemMutation,
} from '@/hooks/useMatrixQueries';
import { buildFolderTree, type FolderTreeNode } from '@/utils/folderTree';
import type { MatrixFolder, SavedMatrixSystem } from '@/types/matrix';
import { FolderModal } from '@/components/FolderModal';
import { MoveMatrixModal } from '@/components/MoveMatrixModal';
import { DeleteFolderModal } from '@/components/DeleteFolderModal';
import {
  Folder,
  FolderOpen,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Layers,
  Database,
  Pencil,
  Trash2,
  FolderInput,
  PanelLeftClose,
  FileSpreadsheet,
} from 'lucide-react';

export const MatrixSidebar: React.FC = () => {
  const { data: folders = [] } = useFoldersQuery();
  const { data: catalog = [] } = useCatalogQuery();

  const createFolderMutation = useCreateFolderMutation();
  const updateFolderMutation = useUpdateFolderMutation();
  const deleteFolderMutation = useDeleteFolderMutation();
  const moveSystemMutation = useMoveSystemMutation();
  const deleteSystemMutation = useDeleteSystemMutation();

  const {
    activeSystemId,
    activeFolderId,
    isSidebarOpen,
    expandedFolderIds,
    toggleSidebar,
    toggleFolderExpanded,
    setActiveFolderId,
    selectSystem,
    draftSheets,
    draftName,
  } = useMatrixStore();

  // Состояния модалок
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<MatrixFolder | null>(null);
  const [defaultParentId, setDefaultParentId] = useState<string | null>(null);

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [matrixToMove, setMatrixToMove] = useState<SavedMatrixSystem | null>(null);

  const [deleteFolderModalOpen, setDeleteFolderModalOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState<MatrixFolder | null>(null);

  // Drag and drop состояние
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  if (!isSidebarOpen) return null;

  const tree = buildFolderTree(folders, catalog);
  const rootMatrices = catalog.filter((s) => !s.folderId);
  const totalMatricesCount = catalog.length;

  const handleDragStart = (e: React.DragEvent, systemId: string) => {
    e.dataTransfer.setData('text/plain', systemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverTargetId(null);
    const systemId = e.dataTransfer.getData('text/plain');
    if (!systemId) return;

    const currentSys = catalog.find((s) => s.id === systemId);
    if (!currentSys || currentSys.folderId === targetFolderId) return;

    await moveSystemMutation.mutateAsync({ systemId, folderId: targetFolderId });
  };

  const openCreateFolderModal = (parentId: string | null = null) => {
    setEditingFolder(null);
    setDefaultParentId(parentId);
    setFolderModalOpen(true);
  };

  const openEditFolderModal = (folder: MatrixFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingFolder(folder);
    setDefaultParentId(folder.parentId);
    setFolderModalOpen(true);
  };

  const openDeleteFolderModal = (folder: MatrixFolder, e: React.MouseEvent) => {
    e.stopPropagation();
    setFolderToDelete(folder);
    setDeleteFolderModalOpen(true);
  };

  const openMoveMatrixModal = (matrix: SavedMatrixSystem, e: React.MouseEvent) => {
    e.stopPropagation();
    setMatrixToMove(matrix);
    setMoveModalOpen(true);
  };

  // Рекурсивный рендерер узла папки
  const renderFolderNode = (node: FolderTreeNode, depth = 0) => {
    const isExpanded = Boolean(expandedFolderIds[node.folder.id]);
    const isFolderActive = activeFolderId === node.folder.id;
    const isDragOver = dragOverTargetId === node.folder.id;

    return (
      <div key={node.folder.id} className="space-y-0.5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (dragOverTargetId !== node.folder.id) {
              setDragOverTargetId(node.folder.id);
            }
          }}
          onDragLeave={() => {
            if (dragOverTargetId === node.folder.id) {
              setDragOverTargetId(null);
            }
          }}
          onDrop={(e) => handleDrop(e, node.folder.id)}
          onClick={() => setActiveFolderId(node.folder.id)}
          style={{ paddingLeft: `${depth * 14 + 10}px` }}
          className={`group flex items-center justify-between pr-2 py-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
            isDragOver
              ? 'bg-cool-gray-10/80 border border-brand-cyan shadow-sm'
              : isFolderActive
              ? 'bg-cool-gray-10/70 text-white font-medium border-l-2 border-rao-orange'
              : 'text-cool-gray-1 hover:bg-cool-gray-10/40'
          }`}
        >
          <div className="flex items-center gap-1.5 truncate pr-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolderExpanded(node.folder.id);
              }}
              className="p-0.5 text-cool-gray-4 hover:text-white rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-rao-orange shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-rao-orange shrink-0" />
            )}

            <span className="truncate">{node.folder.name}</span>
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[10px] text-rao-grey font-mono group-hover:hidden">
              {node.totalMatricesCount}
            </span>

            <div className="hidden group-hover:flex items-center gap-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateFolderModal(node.folder.id);
                }}
                title="Добавить подпапку"
                className="p-1 hover:bg-cool-gray-10/60 rounded text-rao-grey hover:text-brand-lightgreen transition"
              >
                <FolderPlus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => openEditFolderModal(node.folder, e)}
                title="Переименовать"
                className="p-1 hover:bg-cool-gray-10/60 rounded text-rao-grey hover:text-brand-cyan transition"
              >
                <Pencil className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => openDeleteFolderModal(node.folder, e)}
                title="Удалить"
                className="p-1 hover:bg-cool-gray-10/60 rounded text-rao-grey hover:text-brand-red transition"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Раскрытое содержимое: подпапки и матрицы */}
        {isExpanded && (
          <div className="space-y-0.5">
            {/* Дочерние подпапки */}
            {node.children.map((child) => renderFolderNode(child, depth + 1))}

            {/* Матрицы в текущей папке */}
            {node.matrices.map((matrix) => renderMatrixItem(matrix, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderMatrixItem = (matrix: SavedMatrixSystem, depth: number) => {
    const isSelected = activeSystemId === matrix.id;
    const rowsCount = matrix.sheets.reduce((acc, s) => acc + s.rows.length, 0);

    return (
      <div
        key={matrix.id}
        draggable
        onDragStart={(e) => handleDragStart(e, matrix.id)}
        onClick={() => selectSystem(matrix.id)}
        style={{ paddingLeft: `${depth * 14 + 18}px` }}
        className={`group flex items-center justify-between pr-2 py-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
          isSelected
            ? 'bg-cool-gray-10/80 text-white font-medium border-l-2 border-rao-orange shadow-xs'
            : 'text-cool-gray-1 hover:bg-cool-gray-10/40'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate pr-1">
          <Database
            className={`w-3.5 h-3.5 shrink-0 ${
              isSelected ? 'text-brand-cyan' : 'text-rao-grey'
            }`}
          />
          <span className="truncate">{matrix.name}</span>
        </div>

        <div className="flex items-center gap-1">
          <span
            className={`text-[10px] font-mono px-1 rounded ${
              isSelected
                ? 'bg-cool-gray-10 text-cool-gray-1'
                : 'text-rao-grey group-hover:hidden'
            }`}
          >
            {rowsCount}
          </span>

          <div className="hidden group-hover:flex items-center gap-0.5">
            <button
              type="button"
              onClick={(e) => openMoveMatrixModal(matrix, e)}
              title="Переместить в другую папку..."
              className="p-1 rounded hover:bg-cool-gray-10/60 text-rao-grey hover:text-brand-lightgreen transition"
            >
              <FolderInput className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Удалить матрицу «${matrix.name}»?`)) {
                  deleteSystemMutation.mutate(matrix.id);
                }
              }}
              title="Удалить матрицу"
              className="p-1 rounded hover:bg-cool-gray-10/60 text-rao-grey hover:text-brand-red transition"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <aside className="w-64 shrink-0 bg-cool-gray-10/30 border-r border-rao-grey/20 flex flex-col h-full select-none">
        {/* Заголовок сайдбара */}
        <div className="px-3.5 py-3 border-b border-rao-grey/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-cyan" />
            <span className="text-xs font-bold text-white uppercase tracking-wide">
              Каталог матриц
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => openCreateFolderModal(null)}
              className="p-1.5 rounded-lg text-rao-grey hover:text-brand-lightgreen hover:bg-cool-gray-10/60 transition"
              title="Создать папку в корне"
            >
              <FolderPlus className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-rao-grey hover:text-white hover:bg-cool-gray-10/60 transition"
              title="Свернуть боковую панель"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Каталог: Начальная корневая папка по умолчанию */}
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {/* Открытый несохраненный черновик */}
          {draftSheets.length > 0 && (
            <button
              type="button"
              onClick={() => selectSystem('DRAFT')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs border border-rao-orange/40 transition mb-1 ${
                activeSystemId === 'DRAFT'
                  ? 'bg-rao-orange/20 text-rao-orange font-medium'
                  : 'bg-rao-orange/10 text-rao-orange hover:bg-rao-orange/20'
              }`}
            >
              <div className="flex items-center gap-2 truncate pr-1">
                <FileSpreadsheet className="w-3.5 h-3.5 text-rao-orange shrink-0" />
                <span className="truncate">Черновик: {draftName}</span>
              </div>
              <span className="text-[10px] text-rao-orange/80 font-mono">
                {draftSheets.reduce((acc, s) => acc + s.rows.length, 0)}
              </span>
            </button>
          )}

          {/* Корневая системная папка (Корень) */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverTargetId !== '__ROOT__') {
                setDragOverTargetId('__ROOT__');
              }
            }}
            onDragLeave={() => {
              if (dragOverTargetId === '__ROOT__') {
                setDragOverTargetId(null);
              }
            }}
            onDrop={(e) => handleDrop(e, null)}
            onClick={() => {
              setActiveFolderId('ALL');
              selectSystem('ALL');
            }}
            className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer select-none transition ${
              dragOverTargetId === '__ROOT__'
                ? 'bg-cool-gray-10/80 border border-brand-cyan shadow-sm'
                : activeFolderId === 'ALL' && activeSystemId === 'ALL'
                ? 'bg-cool-gray-10/70 text-white font-medium border-l-2 border-rao-orange'
                : 'text-cool-gray-1 hover:bg-cool-gray-10/40'
            }`}
          >
            <div className="flex items-center gap-1.5 truncate pr-1">
              <Folder className="w-3.5 h-3.5 text-rao-orange shrink-0" />
              <span className="font-semibold">Корень</span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] text-rao-grey font-mono group-hover:hidden">
                {totalMatricesCount}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateFolderModal(null);
                }}
                title="Создать папку в корне"
                className="hidden group-hover:flex p-1 hover:bg-cool-gray-10/80 rounded text-rao-grey hover:text-brand-lightgreen transition"
              >
                <FolderPlus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Вложенные папки */}
          {tree.map((node) => renderFolderNode(node, 1))}

          {/* Корневые матрицы без папки */}
          {rootMatrices.map((matrix) => renderMatrixItem(matrix, 1))}
        </div>

        {/* Футер сайдбара с подсказкой */}
        <div className="p-2.5 border-t border-rao-grey/20 text-[10px] text-rao-grey flex items-center justify-between">
          <span>Папок: {folders.length}</span>
          <span>Перетащите для переноса</span>
        </div>
      </aside>

      {/* Модалки */}
      <FolderModal
        isOpen={folderModalOpen}
        onClose={() => setFolderModalOpen(false)}
        initialFolder={editingFolder}
        defaultParentId={defaultParentId}
        folders={folders}
        onSubmit={async ({ name, parentId }) => {
          if (editingFolder) {
            await updateFolderMutation.mutateAsync({
              id: editingFolder.id,
              name,
              parentId,
            });
          } else {
            await createFolderMutation.mutateAsync({ name, parentId });
          }
        }}
      />

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

      <DeleteFolderModal
        isOpen={deleteFolderModalOpen}
        onClose={() => {
          setDeleteFolderModalOpen(false);
          setFolderToDelete(null);
        }}
        folder={folderToDelete}
        folders={folders}
        catalog={catalog}
        onConfirmDelete={async (folderId, deleteContents) => {
          await deleteFolderMutation.mutateAsync({ id: folderId, deleteContents });
        }}
      />
    </>
  );
};
