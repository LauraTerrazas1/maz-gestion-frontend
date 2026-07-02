import Link from "next/link";

type Props = {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
  alertCount: number;
};

export default function Header({ isCollapsed, toggleCollapsed, alertCount }: Props) {
  return (
    <header className="flex h-16 items-center justify-between overflow-visible rounded-2xl bg-white px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleCollapsed}
          className="mr-2 flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF7E1] text-[#102033]"
          aria-label="Toggle sidebar"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
            <path d="M3 12h18M3 6h18M3 18h18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <p className="text-sm font-semibold text-[#102033]">
          MAZ Producciones
          <span className="mx-2 text-slate-300">/</span>
          <span className="font-medium text-slate-600">Sistema de Gestión Operativa</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-full border border-[#92C83E]/40 bg-[#EAF7E1] px-3 py-1.5 text-xs font-bold text-[#4F7D14] shadow-sm">
          MVP Operativo
        </button>

        <Link
          href="/alertas"
          className="relative rounded-full p-2 text-slate-600 hover:bg-slate-100"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0 1 18 14.158V11a6 6 0 1 0-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {alertCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {alertCount > 9 ? "9+" : alertCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}