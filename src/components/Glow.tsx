export function Glow() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-accent-fuchsia/15 blur-[140px]" />
      <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-accent-cyan/12 blur-[140px]" />
      <div className="absolute bottom-0 left-1/3 h-96 w-96 rounded-full bg-accent-emerald/8 blur-[140px]" />
    </div>
  );
}