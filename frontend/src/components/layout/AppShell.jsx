import { useAuth } from "../../context/AuthContext.jsx";

export function AppShell({ children }) {
  const { session, logout } = useAuth();

  return (
    <div className="min-h-screen px-4 py-6 text-slate-100 md:px-8">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-aqua">WEMA</p>
          <h1 className="text-3xl font-bold">Weather Event Money Assurance</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">
            Automated income protection for riders when verified calamities block work.
          </p>
        </div>

        <div className="glass flex items-center gap-3 rounded-full px-4 py-3">
          {session?.user ? (
            <>
              <span className="text-sm text-slate-300">
                {session.user.name} · {session.user.role}
              </span>
              <button
                className="rounded-full bg-aqua px-4 py-2 text-sm font-semibold text-slate-950"
                onClick={logout}
              >
                Logout
              </button>
            </>
          ) : (
            <span className="text-sm text-slate-300">Authentication required</span>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
