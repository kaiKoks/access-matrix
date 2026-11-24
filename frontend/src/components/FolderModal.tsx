import React, { useState } from 'react';
import type { MatrixFolder } from '@/types/matrix';
import { getDescendantFolderIds, getFolderBreadcrumbString } from '@/utils/folderTree';
import { Folder, FolderPlus, X } from 'lucide-react';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFolder?: MatrixFolder | null;
  defaultParentId?: string | null;
  folders: MatrixFolder[];
  onSubmit: (data: { name: string; parentId: string | null }) => Promise<void> | void;
}

const FolderModalDialog: React.FC<{
  onClose: () => void;
  initialFolder?: MatrixFolder | null;
  defaultParentId?: string | null;
  folders: MatrixFolder[];
  onSubmit: (data: { name: string; parentId: string | null }) => Promise<void> | void;
}> = ({ onClose, initialFolder, defaultParentId, folders, onSubmit }) => {
  const isEditing = Boolean(initialFolder);
  const [name, setName] = useState(initialFolder?.name ?? '');
  const [parentId, setParentId] = useState<string | null>(
    initialFolder ? initialFolder.parentId : (defaultParentId ?? null)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Нельзя выбирать родителем саму себя или своих потомков
  const invalidParentIds = new Set<string>();
  if (initialFolder) {
    invalidParentIds.add(initialFolder.id);
    const descendants = getDescendantFolderIds(folders, initialFolder.id);
    descendants.forEach((id) => invalidParentIds.add(id));
  }

  const availableParents = folders.filter((f) => !invalidParentIds.has(f.id));

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onSubmit({ name: cleanName, parentId });
      onClose();
    } catch {
      // Ошибка обрабатывается на уровне мутации
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
            <div className="p-2 rounded-lg bg-rao-blue text-brand-cyan border border-brand-cyan/30">
              {isEditing ? <Folder className="w-4 h-4 text-rao-orange" /> : <FolderPlus className="w-4 h-4 text-rao-orange" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isEditing ? 'Переименовать папку' : 'Создать новую папку'}
              </h3>
              <p className="text-xs text-rao-grey">
                {isEditing
                  ? 'Измените название или расположение папки'
                  : 'Задайте имя и выберите расположение в дереве'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-cool-gray-1">
              Название папки <span className="text-brand-red">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Продакшн, Сегмент БД, Серверы..."
              className="w-full px-3 py-2 bg-black/60 border border-rao-grey/20 rounded-lg text-xs text-white focus:outline-none focus:border-brand-cyan transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-cool-gray-1">
              Родительская папка (расположение)
            </label>
            <select
              value={parentId || ''}
              onChange={(e) => setParentId(e.target.value ? e.target.value : null)}
              className="w-full px-3 py-2 bg-black/60 border border-rao-grey/20 rounded-lg text-xs text-cool-gray-1 focus:outline-none focus:border-brand-cyan transition cursor-pointer"
            >
              <option value="">📁 Корень (без родительской папки)</option>
              {availableParents.map((f) => {
                const pathStr = getFolderBreadcrumbString(folders, f.id);
                return (
                  <option key={f.id} value={f.id}>
                    📁 {pathStr}
                  </option>
                );
              })}
            </select>
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
              type="submit"
              disabled={!name.trim() || isSubmitting}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-rao-orange hover:bg-rao-orange/80 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-rao-orange/20"
            >
              {isSubmitting ? 'Сохранение...' : isEditing ? 'Сохранить' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FolderModal: React.FC<FolderModalProps> = ({
  isOpen,
  onClose,
  initialFolder,
  defaultParentId,
  folders,
  onSubmit,
}) => {
  if (!isOpen) return null;
  return (
    <FolderModalDialog
      onClose={onClose}
      initialFolder={initialFolder}
      defaultParentId={defaultParentId}
      folders={folders}
      onSubmit={onSubmit}
    />
  );
};
