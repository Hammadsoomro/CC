import { Link } from "react-router-dom";

export function MarketingSidebar() {
  return (
    <aside className="hidden lg:flex lg:w-64 shrink-0">
      <div className="sticky top-0 h-[100svh] w-64 border-r bg-zinc-50 text-zinc-700">
        <div className="px-4 py-4 border-b">
          <Link to="/" className="block text-lg font-semibold tracking-tight hover:underline">
            Connectlify
          </Link>
        </div>
        <nav className="px-2 py-3 text-sm font-light">
          <ul className="space-y-1">
            <li>
              <a href="#hero" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-zinc-100">
                <span>Overview</span>
              </a>
            </li>
            <li>
              <a href="#features" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-zinc-100">
                <span>Features</span>
              </a>
            </li>
            <li>
              <a href="#pricing" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-zinc-100">
                <span>Pricing</span>
              </a>
            </li>
            <li>
              <Link to="/login" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-zinc-100">
                <span>Login</span>
              </Link>
            </li>
            <li>
              <Link to="/signup" className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-zinc-100">
                <span>Get Started</span>
              </Link>
            </li>
          </ul>
        </nav>
        <div className="mt-auto p-3 text-xs text-zinc-500">
          <div className="border-t pt-3">
            © {new Date().getFullYear()} Connectlify
          </div>
        </div>
      </div>
    </aside>
  );
}
