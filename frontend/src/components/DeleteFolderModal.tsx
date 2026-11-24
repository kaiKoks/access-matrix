import React, { useState } from 'react';
import type { MatrixFolder, SavedMatrixSystem } from '@/types/matrix';
import { getDescendantFolderIds } from '@/utils/folderTree';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: MatrixFolder | null;
  folders: MatrixFolder[];
  catalog: SavedMatrixSystem[];
  onConfirmDelete: (folderId: string, deleteContents: boolean) => Promise<void> | void;
}

const DeleteFolderDialog: React.FC<{
  onClose: () => void;
  folder: MatrixFolder;
  folders: MatrixFolder[];
  catalog: SavedMatrixSystem[];
  onConfirmDelete: (folderId: string, deleteContents: boolean) => Promise<void> | void;
}> = ({ onClose, folder, folders, catalog, onConfirmDelete }) => {
  const [deleteContents, setDeleteContents] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const descendantFolderIds = getDescendantFolderIds(folders, folder.id);
  const allFolderIds = [folder.id, ...descendantFolderIds];

  const affectedMatricesCount = catalog.filter(
    (m) => m.folderId && allFolderIds.includes(m.folderId)
  ).length;

  const hasNestedContent = affectedMatricesCount > 0 || descendantFolderIds.length > 0;

  const handleConfirm = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      await onConfirmDelete(folder.id, deleteContents);
      onClose();
    } catch {
      // handled
    } finally {
      setIsDeleting(false);
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
            <div className="p-2 rounded-lg bg-brand-red/20 text-brand-red border border-brand-red/40">
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Удалить папку</h3>
              <p className="text-xs text-rao-grey">
                Папка: <span className="text-white font-semibold">«{folder.name}»</span>
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

        {hasNestedContent ? (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rao-orange/15 border border-rao-orange/30 text-rao-orange text-xs">
              <AlertTriangle className="w-4 h-4 text-rao-orange shrink-0 mt-0.5" />
              <div>
                В этой папке содержится:
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-cool-gray-1">
                  {affectedMatricesCount > 0 && (
                    <li>
                      Матриц доступа:{' '}
                      <span className="font-bold text-white">{affectedMatricesCount}</span>
                    </li>
                  )}
                  {descendantFolderIds.length > 0 && (
                    <li>
                      Вложенных подпапок:{' '}
                      <span className="font-bold text-white">
                        {descendantFolderIds.length}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-cool-gray-1">Что сделать с содержимым?</label>
              <div className="space-y-1.5">
                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-rao-grey/20 bg-black/60 hover:bg-rao-blue/20 cursor-pointer transition">
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={!deleteContents}
                    onChange={() => setDeleteContents(false)}
                    className="mt-0.5 text-brand-cyan focus:ring-0"
                  />
                  <div>
                    <span className="block text-xs font-semibold text-white">
                      Сохранить матрицы (безопасно)
                    </span>
                    <span className="block text-[11px] text-rao-grey">
                      Переместить матрицы и подпапки на уровень выше (в родительскую папку или корень)
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2.5 rounded-lg border border-brand-red/40 bg-brand-red/10 hover:bg-brand-red/20 cursor-pointer transition">
                  <input
                    type="radio"
                    name="deleteMode"
                    checked={deleteContents}
                    onChange={() => setDeleteContents(true)}
                    className="mt-0.5 text-brand-red focus:ring-0"
                  />
                  <div>
                    <span className="block text-xs font-bold text-brand-red">
                      Удалить папку вместе со всеми матрицами
                    </span>
                    <span className="block text-[11px] text-cool-gray-4">
                      Все матрицы и подпапки внутри будут безвозвратно удалены из БД
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-xs text-cool-gray-1">
            Вы уверены, что хотите удалить пустую папку «
            <span className="text-white font-semibold">{folder.name}</span>»?
          </p>
        )}

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
            disabled={isDeleting}
            onClick={handleConfirm}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-brand-red hover:bg-brand-red/80 text-white transition disabled:opacity-40 shadow-md hover:shadow-brand-red/20"
          >
            {isDeleting ? 'Удаление...' : 'Удалить папку'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const DeleteFolderModal: React.FC<DeleteFolderModalProps> = ({
  isOpen,
  onClose,
  folder,
  folders,
  catalog,
  onConfirmDelete,
}) => {
  if (!isOpen || !folder) return null;
  return (
    <DeleteFolderDialog
      onClose={onClose}
      folder={folder}
      folders={folders}
      catalog={catalog}
      onConfirmDelete={onConfirmDelete}
    />
  );
};
