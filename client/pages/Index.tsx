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

        {/* Visual section */}
        <section className="mx-auto max-w-6xl pb-24">
          <div className="rounded-2xl border bg-gradient-to-br from-fuchsia-200/30 via-cyan-200/30 to-transparent dark:from-fuchsia-500/10 dark:via-cyan-500/10 p-8">
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
                <img src="https://cdn.builder.io/o/assets%2F14e837e0b7b5493ab1e1298323cf9f78%2F1396f8dcd3104269bd5562705f70d3f6?alt=media&token=f31eb4ff-5ba0-4b15-a128-1713396b817b&apiKey=14e837e0b7b5493ab1e1298323cf9f78" alt="Hero graphic" className="absolute inset-0 h-full w-full object-cover rounded-xl border shadow-xl" />
                <div className="absolute -z-10 -inset-4 rounded-2xl bg-gradient-to-tr from-primary/20 to-accent/20 blur-2xl" />
              </div>
            </div>
          </div>
          <div className="mx-auto mt-10 flex justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-4 w-4 text-zinc-700">
              <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </div>
        </section>

        {/* Secondary testimonial */}
        <section className="mx-auto max-w-3xl pb-16">
          <div className="relative mx-auto text-center rounded-2xl border border-zinc-200/50 bg-white/70 backdrop-blur-lg shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),_0_8px_10px_-6px_rgba(0,0,0,0.1)] px-6 py-8">
            <div className="absolute left-1/2 -top-4 -translate-x-1/2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>
            <blockquote className="mt-4 text-zinc-700 italic text-lg leading-7">“Good communication is the bridge between confusion and clarity.”</blockquote>
            <p className="mt-3 text-sm font-medium text-zinc-500">— Nat Turner</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button className="w-2 h-2 rounded-full bg-zinc-300" aria-label="slide 1" />
              <button className="w-2 h-2 rounded-full bg-zinc-300" aria-label="slide 2" />
              <button className="w-2 h-2 rounded-full bg-zinc-300" aria-label="slide 3" />
              <button className="w-2 h-2 rounded-full bg-blue-600" aria-label="slide 4" />
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
