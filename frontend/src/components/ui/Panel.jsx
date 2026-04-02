export function Panel({ title, subtitle, children, className = "" }) {
  return (
    <section className={`glass rounded-3xl p-6 shadow-panel ${className}`}>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-300">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

