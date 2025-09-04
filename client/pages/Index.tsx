import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { MessageSquare, Clock, Globe, Shield } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated background accents */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      <header className="flex items-center justify-between px-6 py-4 border-b">
        <button
          className="text-lg font-bold"
          onClick={async () => {
            try {
              const token = localStorage.getItem("jwt");
              const r = await fetch("/api/auth/me", { credentials: "include", headers: token ? { Authorization: `Bearer ${token}` } : {} });
              if (r.ok) { window.location.href = "/dashboard"; return; }
            } catch {}
            window.location.href = "/";
          }}
        >
          Connectlify
        </button>
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
          <div className="space-y-1">
            <h1 className="text-5xl md:text-7xl font-bold mb-6"><span className="text-sky-600">Connect with</span></h1>
            <h1 className="text-5xl md:text-7xl font-bold mb-6"><span className="text-pink-600">Anyone</span></h1>
            <h1 className="text-5xl md:text-7xl font-bold mb-6"><span className="text-emerald-500">Anywhere</span></h1>
          </div>
          <p className="mt-5 text-zinc-600 dark:text-zinc-300 text-lg max-w-2xl mx-auto">
            Professional SMS messaging platform with real-time conversations, global reach, and enterprise-grade reliability. Start messaging the world today.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </section>

        {/* Testimonial / Quote card */}
        <section className="mx-auto max-w-3xl pb-12">
          <div className="relative mx-auto text-center rounded-2xl border border-zinc-200/50 bg-white/70 backdrop-blur-lg shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),_0_8px_10px_-6px_rgba(0,0,0,0.1)] px-6 py-8">
            <div className="absolute left-1/2 -top-4 -translate-x-1/2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
            <blockquote className="mt-4 text-zinc-700 italic text-lg leading-7">“Communication works for those who work at it.”</blockquote>
            <p className="mt-3 text-sm font-medium text-zinc-500">— John Powell</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button className="w-2 h-2 rounded-full bg-zinc-300" aria-label="slide 1" />
              <button className="w-2 h-2 rounded-full bg-blue-600" aria-label="slide 2" />
              <button className="w-2 h-2 rounded-full bg-zinc-300" aria-label="slide 3" />
              <button className="w-2 h-2 rounded-full bg-zinc-300" aria-label="slide 4" />
            </div>
          </div>
        </section>

        {/* Feature grid to lengthen landing page */}
        <section className="mx-auto max-w-6xl pb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border p-6 bg-white/60 backdrop-blur">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <Clock className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 text-center">Real-time Messaging</h3>
              <p className="mt-2 text-sm text-zinc-600 text-center">Instant delivery with typing indicators, read receipts, and real-time sync across devices.</p>
            </div>
            <div className="rounded-xl border p-6 bg-white/60 backdrop-blur">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Globe className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 text-center">Global Reach</h3>
              <p className="mt-2 text-sm text-zinc-600 text-center">Numbers in 50+ countries with competitive pricing and instant activation.</p>
            </div>
            <div className="rounded-xl border p-6 bg-white/60 backdrop-blur">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 text-center">Enterprise Security</h3>
              <p className="mt-2 text-sm text-zinc-600 text-center">Bank‑level encryption, compliance, and data protection for businesses.</p>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto max-w-6xl pb-16">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Simple, transparent pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border p-6 bg-white/70">
              <h3 className="text-xl font-semibold">Starter</h3>
              <div className="mt-2 text-3xl font-bold">$9<span className="text-base font-medium text-zinc-500">/mo</span></div>
              <ul className="mt-4 text-sm text-zinc-600 space-y-1">
                <li>1 number</li>
                <li>Basic features</li>
                <li>Email support</li>
              </ul>
              <div className="mt-6">
                <Button asChild className="w-full"><Link to="/signup">Choose Starter</Link></Button>
              </div>
            </div>
            <div className="rounded-xl border p-6 bg-white">
              <h3 className="text-xl font-semibold">Professional</h3>
              <div className="mt-2 text-3xl font-bold">$19<span className="text-base font-medium text-zinc-500">/mo</span></div>
              <ul className="mt-4 text-sm text-zinc-600 space-y-1">
                <li>Up to 5 numbers</li>
                <li>Advanced features</li>
                <li>Priority support</li>
              </ul>
              <div className="mt-6">
                <Button asChild className="w-full"><Link to="/signup">Choose Professional</Link></Button>
              </div>
            </div>
            <div className="rounded-xl border p-6 bg-white/70">
              <h3 className="text-xl font-semibold">Enterprise</h3>
              <div className="mt-2 text-3xl font-bold">$49<span className="text-base font-medium text-zinc-500">/mo</span></div>
              <ul className="mt-4 text-sm text-zinc-600 space-y-1">
                <li>Unlimited numbers</li>
                <li>All features</li>
                <li>Dedicated support</li>
              </ul>
              <div className="mt-6">
                <Button asChild className="w-full"><Link to="/signup">Choose Enterprise</Link></Button>
              </div>
            </div>
          </div>
        </section>

        {/* Trusted by Thousands stats */}
        <section className="mx-auto max-w-6xl pb-24 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Trusted by Thousands</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-blue-600">10M+</div>
              <div className="text-zinc-600">Messages Sent</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">50+</div>
              <div className="text-zinc-600">Countries</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">99.9%</div>
              <div className="text-zinc-600">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-600">24/7</div>
              <div className="text-zinc-600">Support</div>
            </div>
          </div>
        </section>


      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="text-sm text-muted-foreground">
          By continuing you agree to our <Link to="/privacy" className="underline">Privacy Policy</Link> and <Link to="/terms" className="underline">Terms & Conditions</Link>.
        </div>
        <div className="mt-2">© {new Date().getFullYear()} Connectlify</div>
      </footer>
    </div>
  );
}
