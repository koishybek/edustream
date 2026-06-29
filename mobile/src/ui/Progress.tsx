export function Progress({ value, thin }: { value: number; thin?: boolean }) {
  return (
    <div className={`progress${thin ? " progress--thin" : ""}`}>
      <div
        className="progress__bar"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
