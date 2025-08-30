import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link to="/" className="text-lg font-bold">Connectlify</Link>
        <nav className="flex items-center gap-2">
          <Link to="/pricing" className="text-sm hover:underline">Pricing</Link>
          <Link to="/privacy" className="text-sm hover:underline">Privacy</Link>
          <Link to="/terms" className="text-sm hover:underline">Terms</Link>
          <Button asChild size="sm">
            <Link to="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="px-6">
        <section className="mx-auto max-w-5xl py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">SMS Made Simple for Teams</h1>
          <p className="mt-5 text-muted-foreground text-lg max-w-2xl mx-auto">
            Real-time conversations, wallet-based billing, sub-accounts, and number management powered by SignalWire.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Login</Link>
            </Button>
          </div>
          <div className="mt-10 text-sm text-muted-foreground">
            By continuing you agree to our <Link to="/privacy" className="underline">Privacy Policy</Link> and <Link to="/terms" className="underline">Terms & Conditions</Link>.
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="space-x-4">
          <Link to="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="hover:underline">Terms & Conditions</Link>
        </div>
        <div className="mt-2">© {new Date().getFullYear()} Connectlify</div>
      </footer>
    </div>
  );
}
