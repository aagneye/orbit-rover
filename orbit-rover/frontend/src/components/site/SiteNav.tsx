import Link from "next/link";

interface Props {
  active?: "home" | "auth" | "dashboard";
}

export function SiteNav({ active }: Props) {
  const linkClass = (key: string) =>
    `text-sm transition-colors ${
      active === key ? "text-stone-900 font-medium" : "text-stone-500 hover:text-stone-900"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center text-sm font-bold">
            O
          </span>
          <div className="leading-tight">
            <div className="font-semibold text-stone-900">Orbit Rover</div>
            <div className="text-[10px] text-stone-400 tracking-wide">fix pipelines faster</div>
          </div>
        </Link>

        <nav className="hidden sm:flex items-center gap-8">
          <Link href="/#about" className={linkClass("home")}>
            About
          </Link>
          <a
            href="https://github.com/aagneye/orbit-rover/blob/master/docs/LIVE_SETUP.md"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            Docs
          </a>
          <Link href="/auth" className={linkClass("auth")}>
            Auth
          </Link>
          <Link href="/dashboard" className={linkClass("dashboard")}>
            Dashboard
          </Link>
        </nav>

        <Link href="/auth" className="btn-primary text-sm px-4 py-2">
          Sign in
        </Link>
      </div>
    </header>
  );
}
