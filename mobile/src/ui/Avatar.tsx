import { initials } from "../core/format";

export function Avatar({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div className={`avatar${className ? " " + className : ""}`}>
      {initials(name)}
    </div>
  );
}
