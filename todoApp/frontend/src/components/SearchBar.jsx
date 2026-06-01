function SearchBar({ value, onChange, placeholder = "Search todos..." }) {
  return (
    <div className="search-bar relative">
      <style>
        {`
          .search-bar input {
            transition: box-shadow 180ms ease, background-color 180ms ease;
          }

          .search-bar input:focus {
            box-shadow: 0 10px 26px rgba(31, 41, 55, 0.18);
            background-color: rgba(255, 255, 255, 1);
          }

          @media (prefers-reduced-motion: reduce) {
            .search-bar input {
              transition: none;
            }
          }
        `}
      </style>

      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
          />
        </svg>
      </span>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search todos"
        className="w-full rounded-lg border border-transparent bg-white/90 py-2 pl-10 pr-9 text-gray-800 placeholder-gray-400 shadow focus:outline-none"
      />

      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default SearchBar;
