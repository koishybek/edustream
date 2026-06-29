export function Spinner({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Загрузка"
      className={`spin${className ? " " + className : ""}`}
    />
  );
}
