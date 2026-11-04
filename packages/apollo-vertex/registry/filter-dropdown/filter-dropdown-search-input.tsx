import { SearchIcon, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FilterDropdownSearchInputProps {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

function FilterDropdownSearchInput({
  value,
  placeholder,
  onChange,
  onClear,
}: FilterDropdownSearchInputProps) {
  return (
    <div className="p-2 pb-1">
      <div className="relative">
        <SearchIcon className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 pl-7 pr-7 text-sm"
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <XIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

export { FilterDropdownSearchInput };
