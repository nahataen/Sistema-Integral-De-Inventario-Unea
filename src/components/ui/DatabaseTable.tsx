interface Database {
  name: string;
  lastModified: string;
  size: string;
  path?: string;
}

interface DatabaseTableProps {
  databases: Database[];
}

const DatabaseTable = ({ databases }: DatabaseTableProps) => {
  return (
    <div className="mt-6 md:mt-8 overflow-x-auto border shadow-sm rounded-lg border-gray-200 bg-white">
      <table className="w-full min-w-[640px]">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Nombre</th>
            <th className="hidden sm:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Última Modificación</th>
            <th className="px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Tamaño</th>
            <th className="hidden lg:table-cell px-4 md:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Ruta</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {databases.map((db, index) => (
            <tr key={index}>
              <td className="whitespace-nowrap px-4 md:px-6 py-4 text-sm font-medium text-gray-900">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <span>{db.name}</span>
                  <span className="sm:hidden text-xs mt-1 text-gray-600">{db.lastModified}</span>
                </div>
              </td>
              <td className="hidden sm:table-cell whitespace-nowrap px-4 md:px-6 py-4 text-sm text-gray-600">{db.lastModified}</td>
              <td className="whitespace-nowrap px-4 md:px-6 py-4 text-sm text-gray-600">{db.size}</td>
              <td className="hidden lg:table-cell whitespace-nowrap px-4 md:px-6 py-4 text-sm text-gray-600">{db.path}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DatabaseTable;
