import Link from "next/link";
import { PRODUCTION_URL } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-surface-border bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="font-semibold text-stone-900">Orbit Rover</div>
          <p className="text-sm text-stone-500 mt-1 max-w-sm">
            AI root-cause analysis for GitLab pipelines — where your team already works.
          </p>
        </div>
        <div className="flex flex-wrap gap-6 text-sm text-stone-500">
          <Link href="/auth" className="hover:text-stone-900">
            GitLab Auth
          </Link>
          <Link href="/dashboard" className="hover:text-stone-900">
            Dashboard
          </Link>
          <a href={PRODUCTION_URL} className="hover:text-stone-900">
            Production
          </a>
        </div>
      </div>
    </footer>
  );
}
