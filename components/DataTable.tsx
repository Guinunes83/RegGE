
import React from 'react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  canEdit?: boolean;
}

export const DataTable = <T,>({ data, columns, onEdit, onDelete, canEdit }: DataTableProps<T>) => {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="w-full text-left border-collapse">
        <thead className="bg-[#246b61] text-white">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-3 text-sm font-semibold">{col.header}</th>
            ))}
            {canEdit && <th className="px-4 py-3 text-sm font-semibold text-right">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (canEdit ? 1 : 0)} className="px-4 py-8 text-center text-gray-500 italic">
                Nenhum dado encontrado.
              </td>
            </tr>
          ) : (
            data.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className="px-4 py-3 text-sm text-gray-700">{col.accessor(item)}</td>
                ))}
                {canEdit && (
                  <td className="px-4 py-3 text-sm text-right space-x-2">
                    <button onClick={() => onEdit?.(item)} className="text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => onDelete?.(item)} className="text-red-600 hover:underline">Excluir</button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
