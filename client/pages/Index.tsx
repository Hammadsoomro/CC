import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Index() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      <header className="flex items-center justify-between px-6 py-4 border-b">
        <Link to="/" className="text-lg font-bold">Connectlify</Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/login">Login</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/signup">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="px-6">
        <section className="mx-auto max-w-6xl py-20 text-center">
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

        {/* Feature grid to lengthen landing page */}
        <section className="mx-auto max-w-6xl pb-24">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[{
              title: "Conversations",
              desc: "One inbox, faster replies with organized contacts.",
            }, {
              title: "Wallet Billing",
              desc: "Prepaid balance with Stripe card payments.",
            }, {
              title: "Sub-Accounts",
              desc: "Delegate safely with limits and number assignment.",
            }].map((f) => (
              <div key={f.title} className="rounded-xl border p-6 bg-card/50 backdrop-blur">
                <div className="text-xl font-semibold">{f.title}</div>
                <div className="mt-2 text-sm text-muted-foreground">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Visual section */}
        <section className="mx-auto max-w-6xl pb-24">
          <div className="rounded-2xl border bg-gradient-to-br from-primary/10 via-accent/10 to-transparent p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="text-left">
                <h2 className="text-2xl md:text-3xl font-bold">Themeable UI with Smooth Animations</h2>
                <p className="mt-3 text-muted-foreground">Built with TailwindCSS and Radix UI. Dark mode ready and fast by default.</p>
                <div className="mt-6 flex gap-3">
                  <Button asChild>
                    <Link to="/signup">Start Free</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
              <div className="relative h-64 md:h-72">
                <div className="absolute inset-0 rounded-xl bg-background/60 border shadow-xl animate-[pulse_5s_ease-in-out_infinite]" />
                <div className="absolute inset-4 rounded-xl bg-muted" />
              </div>
            </div>
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
