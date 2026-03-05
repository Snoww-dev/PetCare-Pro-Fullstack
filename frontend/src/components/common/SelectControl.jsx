import { Check, ChevronDown } from "lucide-react";
import { Children, isValidElement, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const SelectControl = ({
  value,
  onChange,
  children,
  className = "",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuRef = useRef(null);
  const [menuStyle, setMenuStyle] = useState(null);

  const options = useMemo(
    () =>
      Children.toArray(children)
        .filter((child) => isValidElement(child) && child.type === "option")
        .map((child) => ({
          value: String(child.props.value ?? ""),
          label: child.props.children,
          disabled: Boolean(child.props.disabled),
        })),
    [children],
  );

  const selectedValue = String(value ?? "");
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === selectedValue),
    [options, selectedValue],
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !rootRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;

    const updateMenuPosition = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      setMenuStyle({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open]);

  const handleSelect = (nextValue) => {
    onChange?.({
      target: { value: nextValue },
      currentTarget: { value: nextValue },
    });
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
        className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 pr-9 text-left text-sm text-gray-700 shadow-sm outline-none ring-primary transition focus:ring-2 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
      >
        <span className="truncate block">
          {selectedOption?.label ?? options[0]?.label ?? ""}
        </span>
      </button>
      <ChevronDown className="pointer-events-none absolute right-3 top-2.5 size-4 text-gray-400" />

      {open && !disabled && menuStyle &&
        createPortal(
        <div
          ref={menuRef}
          style={menuStyle}
          className="fixed z-[100] max-h-56 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          {options.map((option) => {
            const active = option.value === selectedValue;
            return (
              <button
                key={`${option.value}-${String(option.label)}`}
                type="button"
                disabled={option.disabled}
                onClick={() => handleSelect(option.value)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span className="truncate">{option.label}</span>
                {active && <Check className="size-4" />}
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </div>
  );
};

export default SelectControl;
