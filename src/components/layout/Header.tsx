interface HeaderProps {
  searchValue: string;
  setSearchValue: (value: string) => void;
}

const Header = ({ searchValue, setSearchValue }: HeaderProps) => {
  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-gray-200 px-4 md:px-10 py-3 sticky top-0 z-10 bg-white">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile menu button */}
        <button className="md:hidden p-2 rounded-md hover:bg-gray-100">
          <span className="icon text-xl">☰</span>
        </button>

        <label className="relative flex-1 max-w-md">
          <span className="icon absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
          <input
            className="w-full border py-2 pl-10 pr-4 text-sm rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-500"
            placeholder="Buscar"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </label>
      </div>

      <div className="flex items-center gap-2">
        <button className="hidden sm:flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden h-10 px-4 bg-white text-blue-600 border border-blue-600 text-sm font-bold leading-normal tracking-wide hover:bg-blue-50 transition-colors duration-200 rounded-md">
          <span className="truncate">Exportar</span>
        </button>
        <button className="flex min-w-[70px] sm:min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden h-10 px-3 sm:px-4 bg-blue-600 text-white text-sm font-bold leading-normal tracking-wide hover:bg-blue-700 transition-colors duration-200 rounded-md">
          <span className="truncate">Importar</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
