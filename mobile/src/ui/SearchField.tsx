import type { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";

export function SearchField(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, "size">,
) {
  return (
    <div className="search">
      <Search className="icon" />
      <input {...props} />
    </div>
  );
}
