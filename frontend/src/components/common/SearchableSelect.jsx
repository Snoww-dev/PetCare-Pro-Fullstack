import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

const SearchableSelect = ({
  value,
  onChange,
  options = [],
  placeholder = "Chọn...",
  searchPlaceholder = "Tìm kiếm...",
  disabled = false,
  allowClear = false,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((opt) => String(opt.value) === String(value)),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(normalized));
  }, [options, query]);

  const displayValue = open ? query : selectedOption?.label || query;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-gray-400" />
        <input
          value={displayValue}
          onFocus={() => {
            setOpen(true);
            setQuery(selectedOption?.label || "");
          }}
          onChange={(e) => {
            setOpen(true);
            setQuery(e.target.value);
            if (value) onChange("");
          }}
          onBlur={() => {
            setTimeout(() => {
              setOpen(false);
              if (!value) setQuery("");
            }, 150);
          }}
          disabled={disabled}
          placeholder={selectedOption ? selectedOption.label : placeholder}
          className="h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-18 text-sm text-gray-700 outline-none ring-primary transition focus:ring-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 disabled:opacity-60"
        />

        {allowClear && value && !disabled && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
            className="absolute right-8 top-2.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="size-4" />
          </button>
        )}

        <ChevronDown className="pointer-events-none absolute right-3 top-2.5 size-4 text-gray-400" />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          {filteredOptions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Không tìm thấy kết quả cho "{query || searchPlaceholder}"
            </p>
          ) : (
            filteredOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(opt.value);
                  setQuery(opt.label);
                  setOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors ${
                  String(opt.value) === String(value)
                    ? "bg-primary text-white"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                }`}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
