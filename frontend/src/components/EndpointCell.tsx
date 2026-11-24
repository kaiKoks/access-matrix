import React from 'react';
import { Globe, Network, Server } from 'lucide-react';

export const EndpointCell: React.FC<{ value: any }> = ({ value }) => {
  if (!value) return <span className="text-cool-gray-8">—</span>;

  const items = String(value)
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-1">
      {items.map((item, i) => {
        const isUrl = /^https?:\/\//i.test(item);
        const isSubnet = /\/\d{1,2}$|[–-]/.test(item) && !item.includes('.ru');

        return (
          <div
            key={i}
            className="inline-flex items-center gap-1.5 text-xs font-mono bg-black/60 border border-rao-grey/20 px-2 py-1 rounded w-fit max-w-full"
          >
            {isUrl ? (
              <Globe className="w-3 h-3 text-brand-sky shrink-0" />
            ) : isSubnet ? (
              <Network className="w-3 h-3 text-rao-orange shrink-0" />
            ) : (
              <Server className="w-3 h-3 text-brand-cyan shrink-0" />
            )}
            <span className="truncate text-cool-gray-1" title={item}>
              {item}
            </span>
          </div>
        );
      })}
    </div>
  );
};
