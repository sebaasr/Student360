export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="inline-block animate-spin rounded-full border-2 border-gray-200 border-t-navy"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}
