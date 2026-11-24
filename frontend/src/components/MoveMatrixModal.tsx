import React, { useState } from 'react';
import type { MatrixFolder, SavedMatrixSystem } from '@/types/matrix';
import { getFolderBreadcrumbString } from '@/utils/folderTree';
import { FolderInput, Database, X } from 'lucide-react';

interface MoveMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  matrix: SavedMatrixSystem | null;
  folders: MatrixFolder[];
  onMove: (systemId: string, folderId: string | null) => Promise<void> | void;
}

const MoveMatrixDialog: React.FC<{
  onClose: () => void;
  matrix: SavedMatrixSystem;
  folders: MatrixFolder[];
  onMove: (systemId: string, folderId: string | null) => Promise<void> | void;
}> = ({ onClose, matrix, folders, onMove }) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(matrix.folderId ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentFolderStr =
    getFolderBreadcrumbString(folders, matrix.folderId) || 'Корень (без папки)';

  const handleConfirm = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onMove(matrix.id, selectedFolderId);
      onClose();
    } catch {
      // handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-cool-gray-10/95 border border-rao-grey/20 rounded-xl shadow-2xl p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rao-grey/20 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rao-blue text-brand-lightgreen border border-brand-cyan/30">
              <FolderInput className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Переместить матрицу</h3>
              <p className="text-xs text-rao-grey truncate max-w-72">
                Матрица: <span className="text-white font-semibold">«{matrix.name}»</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-rao-grey hover:text-white hover:bg-rao-blue/30 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-xs text-rao-grey">
            Текущее расположение:{' '}
            <span className="font-semibold text-brand-cyan">📁 {currentFolderStr}</span>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-cool-gray-1">
              Выберите новую целевую папку
            </label>
            <div className="max-h-60 overflow-y-auto space-y-1 border border-rao-grey/20 rounded-lg p-1.5 bg-black/60">
              <button
                type="button"
                onClick={() => setSelectedFolderId(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-left transition ${
                  selectedFolderId === null
                    ? 'bg-rao-blue/70 text-white font-medium border border-brand-cyan/50'
                    : 'text-cool-gray-1 hover:bg-rao-blue/30'
                }`}
              >
                <Database className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span>📁 Корень (без папки)</span>
              </button>

              {folders.map((f) => {
                const pathStr = getFolderBreadcrumbString(folders, f.id);
                const isSelected = selectedFolderId === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedFolderId(f.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs text-left transition ${
                      isSelected
                        ? 'bg-rao-blue/70 text-white font-medium border border-brand-cyan/50'
                        : 'text-cool-gray-1 hover:bg-rao-blue/30'
                    }`}
                  >
                    <span className="truncate">📁 {pathStr}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-rao-grey/20">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-rao-grey hover:text-white hover:bg-rao-blue/30 border border-rao-grey/20 transition"
          >
            Отмена
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rao-orange hover:bg-rao-orange/80 text-white transition disabled:opacity-40 shadow-md hover:shadow-rao-orange/20"
          >
            {isSubmitting ? 'Перемещение...' : 'Переместить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const MoveMatrixModal: React.FC<MoveMatrixModalProps> = ({
  isOpen,
  onClose,
  matrix,
  folders,
  onMove,
}) => {
  if (!isOpen || !matrix) return null;
  return <MoveMatrixDialog onClose={onClose} matrix={matrix} folders={folders} onMove={onMove} />;
};
