// One-off seeding script: inserts hand-authored sample designs directly into the
// database, bypassing the Anthropic API. Useful for populating the gallery without
// spending generation credits. Run with: node scripts/seed-designs.mjs
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local", quiet: true });

const sql = neon(process.env.DATABASE_URL);

const FORBIDDEN_PATTERNS = [
  /<script/i,
  /<iframe/i,
  /<object/i,
  /<embed/i,
  /on\w+\s*=/i,
  /\baction\s*=/i,
  /javascript:/i,
];
const HREF_PATTERN = /href\s*=\s*["']([^"']*)["']/gi;

function findSafetyViolation(html) {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(html)) return `matched forbidden pattern: ${pattern}`;
  }
  for (const match of html.matchAll(HREF_PATTERN)) {
    const target = match[1].trim();
    if (target !== "" && !target.startsWith("#")) {
      return `href target outside fragment: "${target}"`;
    }
  }
  return null;
}

const HEIGHT_REPORT_SCRIPT = `<script>
(function () {
  function report() {
    window.parent.postMessage(
      { source: "design-gallery-frame", type: "height", height: document.documentElement.scrollHeight },
      "*"
    );
  }
  window.addEventListener("load", report);
  setTimeout(report, 300);
  if (window.ResizeObserver) {
    new ResizeObserver(report).observe(document.documentElement);
  }
})();
</script>`;

// Kept in sync by hand with lib/font-tokens.ts — only the tokens actually used
// by the hand-authored DESIGNS below need an entry here.
const FONT_TOKEN_CSS = {
  "display-bold": { heading: "'Archivo Black', sans-serif", body: "'Inter', system-ui, sans-serif" },
  "warm-serif": { heading: "'Lora', serif", body: "'Source Sans 3', system-ui, sans-serif" },
  "soft-rounded": { heading: "'Quicksand', sans-serif", body: "'Nunito', system-ui, sans-serif" },
  "modern-sans": { heading: "'Inter', system-ui, sans-serif", body: "'Inter', system-ui, sans-serif" },
  "editorial-serif": { heading: "'Playfair Display', serif", body: "'Inter', system-ui, sans-serif" },
  "humanist-sans": { heading: "'Poppins', sans-serif", body: "'Nunito Sans', system-ui, sans-serif" },
};

function buildFontTokenStyleTag() {
  const rules = Object.entries(FONT_TOKEN_CSS)
    .map(([id, f]) => `[data-font-token="${id}"]{--dg-font-heading:${f.heading};--dg-font-body:${f.body};}`)
    .join("\n");
  return `<style>${rules}</style>`;
}

function buildFontLinkHtml() {
  const families = [
    "Archivo+Black",
    "Lora:wght@500;600;700",
    "Source+Sans+3:wght@400;500;600",
    "Quicksand:wght@600;700",
    "Nunito:wght@400;500;600",
    "Inter:wght@400;500;600;700;800",
    "Playfair+Display:wght@600;700;800",
    "Poppins:wght@500;600;700;800",
    "Nunito+Sans:wght@400;500;600",
  ]
    .map((f) => `family=${f}`)
    .join("&");
  return `<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?${families}&display=swap" rel="stylesheet" />`;
}

function assembleStandaloneHtml(title, sections) {
  const body = sections
    .map((s) => `<div data-font-token="${s.fontToken}">${s.html}</div>`)
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
${buildFontLinkHtml()}
${buildFontTokenStyleTag()}
<script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
${body}
${HEIGHT_REPORT_SCRIPT}
</body>
</html>
`;
}

const DESIGNS = [
  {
    name: "Midnight Ledger",
    style_summary: "dark neubrutalist fintech SaaS with lime accent and thick borders",
    font_token: "display-bold",
    layout_notes: "single-column stacked sections, heavy horizontal rules, mono labels",
    sections: [
      {
        type: "navbar",
        html: `<nav class="bg-black text-white px-8 py-5 flex items-center justify-between border-b-4 border-lime-400">
  <span class="text-xl font-black tracking-tight">LEDGER<span class="text-lime-400">/</span></span>
  <div class="hidden md:flex items-center gap-8 text-sm font-bold uppercase tracking-wide">
    <span>Product</span><span>Pricing</span><span>Docs</span>
  </div>
  <button class="bg-lime-400 text-black font-black px-5 py-2 border-2 border-lime-400 uppercase text-sm">Sign up</button>
</nav>`,
      },
      {
        type: "hero",
        html: `<section class="bg-black text-white px-8 py-24 border-b-4 border-lime-400">
  <div class="max-w-4xl">
    <p class="font-mono text-lime-400 text-sm mb-4">// v2.4 now shipping</p>
    <h1 data-dg-font-role="heading" style="font-family:var(--dg-font-heading)" class="text-6xl md:text-7xl font-black leading-[0.95] mb-6">Bookkeeping<br/>that doesn't<br/><span class="bg-lime-400 text-black px-2">lie to you.</span></h1>
    <p data-dg-font-role="body" style="font-family:var(--dg-font-body)" class="text-neutral-400 text-lg max-w-lg mb-8">Real-time ledgers for teams who are tired of reconciling spreadsheets at 2am.</p>
    <div class="flex gap-4">
      <button class="bg-lime-400 text-black font-black px-8 py-4 border-2 border-lime-400 uppercase">Start free</button>
      <button class="text-white font-black px-8 py-4 border-2 border-white uppercase">Watch demo</button>
    </div>
  </div>
</section>`,
      },
      {
        type: "logos",
        html: `<section class="bg-neutral-950 text-neutral-600 px-8 py-10 border-b-4 border-lime-400">
  <div class="flex flex-wrap justify-between gap-6 font-mono text-sm uppercase tracking-widest max-w-5xl mx-auto">
    <span>Northwind</span><span>Vantage Co</span><span>Ferro Labs</span><span>Kestrel</span><span>Oat &amp; Co</span>
  </div>
</section>`,
      },
      {
        type: "features",
        html: `<section class="bg-black text-white px-8 py-20 grid md:grid-cols-3 gap-0 border-b-4 border-lime-400">
  <div class="p-8 border-2 border-neutral-800"><p class="text-lime-400 font-mono text-sm mb-3">01</p><h3 class="text-2xl font-black mb-2">Live reconciliation</h3><p class="text-neutral-400 text-sm">Every transaction matched the moment it clears, not at month-end.</p></div>
  <div class="p-8 border-2 border-neutral-800 border-t-0 md:border-t-2 md:border-l-0"><p class="text-lime-400 font-mono text-sm mb-3">02</p><h3 class="text-2xl font-black mb-2">Multi-entity ledgers</h3><p class="text-neutral-400 text-sm">Run twelve subsidiaries from one dashboard without losing your mind.</p></div>
  <div class="p-8 border-2 border-neutral-800 border-t-0 md:border-t-2 md:border-l-0"><p class="text-lime-400 font-mono text-sm mb-3">03</p><h3 class="text-2xl font-black mb-2">Audit trail, always on</h3><p class="text-neutral-400 text-sm">Every edit stamped, signed, and impossible to quietly delete.</p></div>
</section>`,
      },
      {
        type: "stats",
        html: `<section class="bg-lime-400 text-black px-8 py-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center border-b-4 border-black">
  <div><p class="text-5xl font-black">4.2k</p><p class="font-mono text-sm uppercase mt-1">Teams onboard</p></div>
  <div><p class="text-5xl font-black">$1.8B</p><p class="font-mono text-sm uppercase mt-1">Reconciled monthly</p></div>
  <div><p class="text-5xl font-black">99.98%</p><p class="font-mono text-sm uppercase mt-1">Uptime</p></div>
  <div><p class="text-5xl font-black">11s</p><p class="font-mono text-sm uppercase mt-1">Avg. close time</p></div>
</section>`,
      },
      {
        type: "testimonials",
        html: `<section class="bg-black text-white px-8 py-20 border-b-4 border-lime-400">
  <div class="max-w-3xl mx-auto border-2 border-lime-400 p-10">
    <p class="text-2xl font-bold leading-snug mb-6">"We closed our books in nine minutes last month. Nine. It used to take a week and a bottle of aspirin."</p>
    <p class="font-mono text-sm text-lime-400">— Priya Nandan, CFO at Vantage Co</p>
  </div>
</section>`,
      },
      {
        type: "pricing",
        html: `<section class="bg-black text-white px-8 py-20 grid md:grid-cols-3 gap-6 border-b-4 border-lime-400 max-w-5xl mx-auto">
  <div class="border-2 border-neutral-800 p-8"><h3 class="font-black text-xl mb-2">Starter</h3><p class="text-4xl font-black mb-4">$0</p><p class="text-neutral-400 text-sm mb-6">Single entity, 3 seats.</p><button class="w-full border-2 border-white py-3 font-black uppercase">Choose</button></div>
  <div class="border-2 border-lime-400 bg-neutral-950 p-8"><h3 class="font-black text-xl mb-2">Growth</h3><p class="text-4xl font-black mb-4">$89<span class="text-base font-normal">/mo</span></p><p class="text-neutral-400 text-sm mb-6">Up to 5 entities, unlimited seats.</p><button class="w-full bg-lime-400 text-black py-3 font-black uppercase">Choose</button></div>
  <div class="border-2 border-neutral-800 p-8"><h3 class="font-black text-xl mb-2">Enterprise</h3><p class="text-4xl font-black mb-4">Custom</p><p class="text-neutral-400 text-sm mb-6">Unlimited everything, SSO, SLA.</p><button class="w-full border-2 border-white py-3 font-black uppercase">Talk to us</button></div>
</section>`,
      },
      {
        type: "cta",
        html: `<section class="bg-lime-400 text-black px-8 py-20 text-center">
  <h2 class="text-4xl md:text-5xl font-black mb-6">Stop lying to your spreadsheet.</h2>
  <button class="bg-black text-white font-black px-10 py-4 uppercase border-2 border-black">Start free trial</button>
</section>`,
      },
      {
        type: "footer",
        html: `<footer class="bg-black text-neutral-500 px-8 py-10 flex flex-col md:flex-row justify-between gap-4 font-mono text-sm border-t-4 border-lime-400">
  <span>© Ledger, Inc.</span>
  <div class="flex gap-6"><span>Privacy</span><span>Terms</span><span>Status</span></div>
</footer>`,
      },
    ],
  },

  {
    name: "Linen & Ink",
    style_summary: "warm minimal serif portfolio for an independent designer",
    font_token: "warm-serif",
    layout_notes: "asymmetric two-column hero, offset masonry gallery",
    sections: [
      {
        type: "navbar",
        html: `<nav class="bg-[#f7f3ec] px-10 py-6 flex items-center justify-between">
  <span class="font-serif text-xl text-[#2b2620]">Marguerite Voss</span>
  <div class="hidden md:flex gap-10 text-sm text-[#6b6255] tracking-wide">
    <span>Work</span><span>About</span><span>Journal</span><span>Contact</span>
  </div>
</nav>`,
      },
      {
        type: "hero",
        html: `<section class="bg-[#f7f3ec] px-10 pt-8 pb-24">
  <div class="max-w-2xl">
    <h1 data-dg-font-role="heading" style="font-family:var(--dg-font-heading)" class="font-serif text-5xl md:text-6xl text-[#2b2620] leading-tight mb-6">Interiors that feel<br/>like they were<br/>always there.</h1>
    <p data-dg-font-role="body" style="font-family:var(--dg-font-body)" class="text-[#6b6255] text-lg max-w-md">A small studio in Lisbon designing quiet homes and the objects inside them.</p>
  </div>
</section>`,
      },
      {
        type: "gallery",
        html: `<section class="bg-[#f7f3ec] px-10 pb-24 grid grid-cols-2 md:grid-cols-3 gap-4">
  <div class="aspect-[4/5] bg-[#e3d9c8]"></div>
  <div class="aspect-[4/5] bg-[#cbb89a] mt-8"></div>
  <div class="aspect-[4/5] bg-[#dcd0ba]"></div>
  <div class="aspect-[4/5] bg-[#d6c4a8] mt-8"></div>
  <div class="aspect-[4/5] bg-[#efe7d8]"></div>
  <div class="aspect-[4/5] bg-[#c4ad8a] mt-8"></div>
</section>`,
      },
      {
        type: "team",
        html: `<section class="bg-[#2b2620] text-[#f7f3ec] px-10 py-24 grid md:grid-cols-2 gap-10 items-center">
  <div class="aspect-square bg-[#3d372e]"></div>
  <div>
    <p class="uppercase tracking-widest text-xs text-[#cbb89a] mb-4">About</p>
    <p class="font-serif text-3xl leading-snug mb-4">Twelve years making rooms that don't try too hard.</p>
    <p class="text-[#b3aa9a]">Marguerite trained in Copenhagen and Kyoto before founding the studio in 2015. The work leans slow, tactile, unfussy.</p>
  </div>
</section>`,
      },
      {
        type: "testimonials",
        html: `<section class="bg-[#f7f3ec] px-10 py-24 text-center">
  <p class="font-serif text-3xl text-[#2b2620] max-w-2xl mx-auto leading-snug">"She listened for six months before drawing a single line. The house feels like us, not like a magazine."</p>
  <p class="text-[#6b6255] mt-6 text-sm uppercase tracking-widest">The Alverez Family</p>
</section>`,
      },
      {
        type: "contact",
        html: `<section class="bg-[#f7f3ec] px-10 pb-24 grid md:grid-cols-2 gap-10 max-w-4xl">
  <div>
    <p class="font-serif text-3xl text-[#2b2620] mb-4">Start a project</p>
    <p class="text-[#6b6255]">Studio takes on four new residential projects a year. Get in touch and we'll find a time to talk.</p>
  </div>
  <div class="space-y-4">
    <div class="border-b border-[#cbb89a] pb-2 text-[#6b6255]">Name</div>
    <div class="border-b border-[#cbb89a] pb-2 text-[#6b6255]">Email</div>
    <button class="bg-[#2b2620] text-[#f7f3ec] px-6 py-3 text-sm uppercase tracking-widest mt-2">Send</button>
  </div>
</section>`,
      },
      {
        type: "footer",
        html: `<footer class="bg-[#2b2620] text-[#b3aa9a] px-10 py-8 flex justify-between text-sm">
  <span>© Marguerite Voss Studio</span>
  <div class="flex gap-6"><span>Instagram</span><span>Pinterest</span></div>
</footer>`,
      },
    ],
  },

  {
    name: "Bubble Stack",
    style_summary: "playful colorful productivity app landing with soft gradients",
    font_token: "soft-rounded",
    layout_notes: "centered hero, 3-col rounded feature cards, pill buttons",
    sections: [
      {
        type: "navbar",
        html: `<nav class="bg-[#f4f0ff] px-8 py-5 flex items-center justify-between rounded-b-3xl">
  <span class="text-2xl font-extrabold text-[#5b3df6]">stackly ✦</span>
  <div class="hidden md:flex gap-8 text-sm font-semibold text-[#6b5f9e]">
    <span>Features</span><span>Templates</span><span>Pricing</span>
  </div>
  <button class="bg-[#5b3df6] text-white font-bold px-5 py-2.5 rounded-full">Get started</button>
</nav>`,
      },
      {
        type: "hero",
        html: `<section class="bg-gradient-to-br from-[#f4f0ff] to-[#ffe8f3] px-8 py-20 text-center">
  <h1 data-dg-font-role="heading" style="font-family:var(--dg-font-heading)" class="text-5xl md:text-6xl font-extrabold text-[#2c2350] max-w-2xl mx-auto leading-tight mb-6">Your to-do list, but it actually sparks joy</h1>
  <p data-dg-font-role="body" style="font-family:var(--dg-font-body)" class="text-[#6b5f9e] text-lg max-w-md mx-auto mb-8">Plan your week with a tool that feels less like work and more like tidying a very cute desk.</p>
  <button class="bg-[#5b3df6] text-white font-bold px-8 py-4 rounded-full text-lg shadow-lg shadow-[#5b3df6]/30">Try it free →</button>
</section>`,
      },
      {
        type: "features",
        html: `<section class="bg-white px-8 py-20 grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
  <div class="bg-[#fff4d6] rounded-3xl p-8"><p class="text-3xl mb-3">🌤️</p><h3 class="font-extrabold text-lg text-[#2c2350] mb-2">Gentle reminders</h3><p class="text-[#6b5f9e] text-sm">Nudges, not nagging. Stackly checks in like a friend, not a boss.</p></div>
  <div class="bg-[#e6f8ee] rounded-3xl p-8"><p class="text-3xl mb-3">🧩</p><h3 class="font-extrabold text-lg text-[#2c2350] mb-2">Drag &amp; drop boards</h3><p class="text-[#6b5f9e] text-sm">Rearrange your day with a flick. Everything snaps satisfyingly into place.</p></div>
  <div class="bg-[#ffe8f3] rounded-3xl p-8"><p class="text-3xl mb-3">🎉</p><h3 class="font-extrabold text-lg text-[#2c2350] mb-2">Tiny celebrations</h3><p class="text-[#6b5f9e] text-sm">Confetti when you finish a list. Yes, really. It helps.</p></div>
</section>`,
      },
      {
        type: "stats",
        html: `<section class="bg-[#5b3df6] px-8 py-16 grid grid-cols-3 gap-6 text-center rounded-3xl max-w-5xl mx-auto text-white">
  <div><p class="text-4xl font-extrabold">2.1M</p><p class="text-sm opacity-80 mt-1">Lists made</p></div>
  <div><p class="text-4xl font-extrabold">98%</p><p class="text-sm opacity-80 mt-1">"Feels lighter"</p></div>
  <div><p class="text-4xl font-extrabold">4.9★</p><p class="text-sm opacity-80 mt-1">App store rating</p></div>
</section>`,
      },
      {
        type: "faq",
        html: `<section class="bg-white px-8 py-20 max-w-2xl mx-auto">
  <h2 class="text-3xl font-extrabold text-[#2c2350] text-center mb-10">Questions, answered</h2>
  <div class="space-y-4">
    <div class="bg-[#f4f0ff] rounded-2xl p-5"><p class="font-bold text-[#2c2350]">Is there a free plan?</p><p class="text-[#6b5f9e] text-sm mt-1">Yep, forever, for up to three boards.</p></div>
    <div class="bg-[#f4f0ff] rounded-2xl p-5"><p class="font-bold text-[#2c2350]">Does it work offline?</p><p class="text-[#6b5f9e] text-sm mt-1">Fully — it syncs quietly once you're back online.</p></div>
    <div class="bg-[#f4f0ff] rounded-2xl p-5"><p class="font-bold text-[#2c2350]">Team plans?</p><p class="text-[#6b5f9e] text-sm mt-1">Coming this spring, currently in beta.</p></div>
  </div>
</section>`,
      },
      {
        type: "cta",
        html: `<section class="bg-gradient-to-br from-[#ffe8f3] to-[#f4f0ff] px-8 py-20 text-center rounded-t-3xl">
  <h2 class="text-4xl font-extrabold text-[#2c2350] mb-6">Ready to tidy your to-do list?</h2>
  <button class="bg-[#5b3df6] text-white font-bold px-8 py-4 rounded-full text-lg">Start for free</button>
</section>`,
      },
      {
        type: "footer",
        html: `<footer class="bg-[#2c2350] text-[#b3a9e0] px-8 py-8 flex justify-between text-sm rounded-b-none">
  <span>© stackly, made with ✦</span>
  <div class="flex gap-6"><span>Twitter</span><span>Support</span></div>
</footer>`,
      },
    ],
  },

  {
    name: "Slate Systems",
    style_summary: "corporate B2B software with navy accent and dense grid structure",
    font_token: "modern-sans",
    layout_notes: "two-column hero with dashboard mock, 4-col dense feature grid",
    sections: [
      {
        type: "navbar",
        html: `<nav class="bg-white px-10 py-4 flex items-center justify-between border-b border-slate-200">
  <span class="font-bold text-slate-900 text-lg">Slate<span class="text-blue-700">Systems</span></span>
  <div class="hidden md:flex gap-8 text-sm text-slate-600 font-medium">
    <span>Platform</span><span>Solutions</span><span>Resources</span><span>Pricing</span>
  </div>
  <div class="flex gap-3">
    <button class="text-slate-700 font-medium text-sm px-4 py-2">Sign in</button>
    <button class="bg-blue-700 text-white font-medium text-sm px-4 py-2 rounded">Request demo</button>
  </div>
</nav>`,
      },
      {
        type: "hero",
        html: `<section class="bg-slate-50 px-10 py-20 grid md:grid-cols-2 gap-10 items-center border-b border-slate-200">
  <div>
    <p class="text-blue-700 font-semibold text-sm mb-3 uppercase tracking-wide">Enterprise resource planning</p>
    <h1 data-dg-font-role="heading" style="font-family:var(--dg-font-heading)" class="text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-5">One system of record for operations, finance, and supply chain.</h1>
    <p data-dg-font-role="body" style="font-family:var(--dg-font-body)" class="text-slate-600 mb-8">Slate Systems replaces the six spreadsheets your ops team swears by with one auditable source of truth.</p>
    <div class="flex gap-3"><button class="bg-blue-700 text-white font-medium px-6 py-3 rounded">Request a demo</button><button class="border border-slate-300 text-slate-700 font-medium px-6 py-3 rounded">View pricing</button></div>
  </div>
  <div class="bg-white border border-slate-200 rounded-lg p-6 grid grid-cols-2 gap-4">
    <div class="bg-slate-100 rounded h-24"></div><div class="bg-slate-100 rounded h-24"></div><div class="bg-slate-100 rounded h-24"></div><div class="bg-slate-100 rounded h-24"></div>
  </div>
</section>`,
      },
      {
        type: "logos",
        html: `<section class="bg-white px-10 py-8 border-b border-slate-200">
  <p class="text-center text-slate-400 text-xs uppercase tracking-widest mb-6">Trusted by operations teams at</p>
  <div class="flex flex-wrap justify-center gap-10 text-slate-400 font-semibold">
    <span>Baymark</span><span>Coreline</span><span>Hartwell Group</span><span>Perigee</span><span>Duna Logistics</span>
  </div>
</section>`,
      },
      {
        type: "features",
        html: `<section class="bg-white px-10 py-20 grid md:grid-cols-4 gap-6 border-b border-slate-200">
  <div class="border border-slate-200 rounded-lg p-6"><div class="w-8 h-8 bg-blue-100 rounded mb-4"></div><h3 class="font-semibold text-slate-900 mb-2">Inventory sync</h3><p class="text-slate-500 text-sm">Real-time stock across every warehouse.</p></div>
  <div class="border border-slate-200 rounded-lg p-6"><div class="w-8 h-8 bg-blue-100 rounded mb-4"></div><h3 class="font-semibold text-slate-900 mb-2">Finance close</h3><p class="text-slate-500 text-sm">Automated reconciliation, audit-ready.</p></div>
  <div class="border border-slate-200 rounded-lg p-6"><div class="w-8 h-8 bg-blue-100 rounded mb-4"></div><h3 class="font-semibold text-slate-900 mb-2">Vendor portal</h3><p class="text-slate-500 text-sm">Suppliers self-serve on POs and invoices.</p></div>
  <div class="border border-slate-200 rounded-lg p-6"><div class="w-8 h-8 bg-blue-100 rounded mb-4"></div><h3 class="font-semibold text-slate-900 mb-2">Role-based access</h3><p class="text-slate-500 text-sm">Granular permissions, SSO, full audit log.</p></div>
</section>`,
      },
      {
        type: "pricing",
        html: `<section class="bg-slate-50 px-10 py-20 grid md:grid-cols-3 gap-6 border-b border-slate-200">
  <div class="bg-white border border-slate-200 rounded-lg p-8"><h3 class="font-semibold text-slate-900 mb-1">Team</h3><p class="text-3xl font-bold text-slate-900 mb-4">$120<span class="text-sm font-normal text-slate-500">/mo</span></p><p class="text-slate-500 text-sm mb-6">Up to 25 users, core modules.</p><button class="w-full border border-slate-300 text-slate-700 py-2.5 rounded font-medium">Start trial</button></div>
  <div class="bg-slate-900 border border-slate-900 rounded-lg p-8 text-white"><h3 class="font-semibold mb-1">Business</h3><p class="text-3xl font-bold mb-4">$420<span class="text-sm font-normal text-slate-400">/mo</span></p><p class="text-slate-400 text-sm mb-6">Unlimited users, all modules, SSO.</p><button class="w-full bg-blue-600 py-2.5 rounded font-medium">Start trial</button></div>
  <div class="bg-white border border-slate-200 rounded-lg p-8"><h3 class="font-semibold text-slate-900 mb-1">Enterprise</h3><p class="text-3xl font-bold text-slate-900 mb-4">Custom</p><p class="text-slate-500 text-sm mb-6">Dedicated infra, custom SLA.</p><button class="w-full border border-slate-300 text-slate-700 py-2.5 rounded font-medium">Contact sales</button></div>
</section>`,
      },
      {
        type: "testimonials",
        html: `<section class="bg-white px-10 py-20 border-b border-slate-200">
  <div class="max-w-3xl mx-auto text-center">
    <p class="text-xl text-slate-800 leading-relaxed mb-6">"We cut our month-end close from eleven days to three. Slate paid for itself in the first quarter."</p>
    <p class="text-slate-500 text-sm font-medium">Devon Achebe, VP Finance at Coreline</p>
  </div>
</section>`,
      },
      {
        type: "faq",
        html: `<section class="bg-slate-50 px-10 py-20 max-w-3xl mx-auto border-b border-slate-200">
  <h2 class="text-2xl font-bold text-slate-900 mb-8">Frequently asked</h2>
  <div class="space-y-4">
    <div class="bg-white border border-slate-200 rounded-lg p-5"><p class="font-semibold text-slate-900">How long does implementation take?</p><p class="text-slate-500 text-sm mt-1">Most teams are live within four to six weeks.</p></div>
    <div class="bg-white border border-slate-200 rounded-lg p-5"><p class="font-semibold text-slate-900">Do you integrate with our existing ERP?</p><p class="text-slate-500 text-sm mt-1">Yes, via our open API and prebuilt connectors.</p></div>
  </div>
</section>`,
      },
      {
        type: "footer",
        html: `<footer class="bg-slate-900 text-slate-400 px-10 py-10 flex flex-col md:flex-row justify-between gap-4 text-sm">
  <span>© Slate Systems, Inc.</span>
  <div class="flex gap-6"><span>Security</span><span>Status</span><span>Privacy</span></div>
</footer>`,
      },
    ],
  },

  {
    name: "The Quarterly",
    style_summary: "editorial magazine-style blog with oversized serif headlines",
    font_token: "editorial-serif",
    layout_notes: "oversized serif hero, 3-col article grid, no hero image",
    sections: [
      {
        type: "navbar",
        html: `<nav class="bg-white px-10 py-6 flex items-center justify-between border-b-2 border-black">
  <span class="font-serif text-2xl font-bold tracking-tight">THE QUARTERLY</span>
  <div class="hidden md:flex gap-8 text-sm uppercase tracking-wide">
    <span>Essays</span><span>Interviews</span><span>Archive</span>
  </div>
</nav>`,
      },
      {
        type: "hero",
        html: `<section class="bg-white px-10 py-16 border-b-2 border-black">
  <p class="uppercase text-xs tracking-widest text-neutral-500 mb-4">Issue 14 — On Slowness</p>
  <h1 data-dg-font-role="heading" style="font-family:var(--dg-font-heading)" class="font-serif text-5xl md:text-7xl leading-[0.95] max-w-3xl mb-6">Why nobody reads the whole thing anymore, and why that's fine.</h1>
  <p data-dg-font-role="body" style="font-family:var(--dg-font-body)" class="text-neutral-600 max-w-lg">A conversation with three editors about attention, algorithms, and the death of the long form — and its quiet return.</p>
</section>`,
      },
      {
        type: "blog-list",
        html: `<section class="bg-white px-10 py-16 grid md:grid-cols-3 gap-10 border-b-2 border-black">
  <article><div class="aspect-[4/3] bg-neutral-200 mb-4"></div><p class="uppercase text-xs text-neutral-500 mb-2">Culture</p><h3 class="font-serif text-xl mb-2">The last generation to remember dial-up</h3><p class="text-neutral-600 text-sm">A meditation on waiting, and what we lost when it disappeared.</p></article>
  <article><div class="aspect-[4/3] bg-neutral-200 mb-4"></div><p class="uppercase text-xs text-neutral-500 mb-2">Interview</p><h3 class="font-serif text-xl mb-2">Twelve questions for a lighthouse keeper</h3><p class="text-neutral-600 text-sm">One of the last three keepers left in the country.</p></article>
  <article><div class="aspect-[4/3] bg-neutral-200 mb-4"></div><p class="uppercase text-xs text-neutral-500 mb-2">Essay</p><h3 class="font-serif text-xl mb-2">On rereading the same five books</h3><p class="text-neutral-600 text-sm">A case against the endless backlist.</p></article>
</section>`,
      },
      {
        type: "team",
        html: `<section class="bg-neutral-100 px-10 py-16 grid md:grid-cols-4 gap-8 border-b-2 border-black">
  <div><div class="aspect-square bg-neutral-300 mb-3"></div><p class="font-serif">Elena Marsh</p><p class="text-neutral-500 text-sm">Editor-in-chief</p></div>
  <div><div class="aspect-square bg-neutral-300 mb-3"></div><p class="font-serif">Tobias Rein</p><p class="text-neutral-500 text-sm">Senior editor</p></div>
  <div><div class="aspect-square bg-neutral-300 mb-3"></div><p class="font-serif">Adaeze Okoro</p><p class="text-neutral-500 text-sm">Staff writer</p></div>
  <div><div class="aspect-square bg-neutral-300 mb-3"></div><p class="font-serif">Sam Wu</p><p class="text-neutral-500 text-sm">Art director</p></div>
</section>`,
      },
      {
        type: "contact",
        html: `<section class="bg-white px-10 py-16 border-b-2 border-black">
  <h2 class="font-serif text-3xl mb-6">Subscribe</h2>
  <p class="text-neutral-600 max-w-md mb-6">Four issues a year, printed on paper that feels like it matters. No newsletter version, on purpose.</p>
  <button class="bg-black text-white px-8 py-3 uppercase text-sm tracking-widest">Subscribe — $48/yr</button>
</section>`,
      },
      {
        type: "footer",
        html: `<footer class="bg-white px-10 py-8 flex justify-between text-sm text-neutral-500">
  <span>© The Quarterly</span>
  <div class="flex gap-6"><span>Masthead</span><span>Submissions</span></div>
</footer>`,
      },
    ],
  },

  {
    name: "Field Goods",
    style_summary: "earthy sage and cream e-commerce landing for a pantry goods brand",
    font_token: "humanist-sans",
    layout_notes: "circular hero image, 3-col icon features, rounded stat band",
    sections: [
      {
        type: "navbar",
        html: `<nav class="bg-[#f4f1e8] px-10 py-5 flex items-center justify-between">
  <span class="font-bold text-xl text-[#3f4f3d]">Field Goods</span>
  <div class="hidden md:flex gap-8 text-sm text-[#5c6b57] font-medium">
    <span>Shop</span><span>Our Farms</span><span>Recipes</span>
  </div>
  <span class="text-[#3f4f3d]">🛒 Cart (0)</span>
</nav>`,
      },
      {
        type: "hero",
        html: `<section class="bg-[#e7e3d3] px-10 py-20 grid md:grid-cols-2 gap-10 items-center">
  <div>
    <h1 data-dg-font-role="heading" style="font-family:var(--dg-font-heading)" class="text-5xl font-bold text-[#3f4f3d] leading-tight mb-5">Pantry staples, straight from the farms that grow them.</h1>
    <p data-dg-font-role="body" style="font-family:var(--dg-font-body)" class="text-[#5c6b57] mb-8">Small-batch grains, oils, and preserves from forty family farms across the valley.</p>
    <button class="bg-[#3f4f3d] text-[#f4f1e8] font-semibold px-8 py-4 rounded-full">Shop the harvest</button>
  </div>
  <div class="aspect-square bg-[#c9c2a3] rounded-full"></div>
</section>`,
      },
      {
        type: "features",
        html: `<section class="bg-[#f4f1e8] px-10 py-16 grid md:grid-cols-3 gap-8 text-center">
  <div><p class="text-3xl mb-3">🌾</p><h3 class="font-semibold text-[#3f4f3d] mb-1">Single-origin</h3><p class="text-[#5c6b57] text-sm">Every product traces back to one named farm.</p></div>
  <div><p class="text-3xl mb-3">🚜</p><h3 class="font-semibold text-[#3f4f3d] mb-1">Fair to farmers</h3><p class="text-[#5c6b57] text-sm">70% of every sale goes straight to the grower.</p></div>
  <div><p class="text-3xl mb-3">📦</p><h3 class="font-semibold text-[#3f4f3d] mb-1">Zero-waste packing</h3><p class="text-[#5c6b57] text-sm">Compostable everything, always.</p></div>
</section>`,
      },
      {
        type: "gallery",
        html: `<section class="bg-[#f4f1e8] px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-4">
  <div class="aspect-square bg-[#d8cfa8] rounded-2xl"></div>
  <div class="aspect-square bg-[#b8c19a] rounded-2xl"></div>
  <div class="aspect-square bg-[#e3b98c] rounded-2xl"></div>
  <div class="aspect-square bg-[#c9c2a3] rounded-2xl"></div>
</section>`,
      },
      {
        type: "stats",
        html: `<section class="bg-[#3f4f3d] text-[#f4f1e8] px-10 py-16 grid grid-cols-3 gap-6 text-center rounded-3xl mx-6">
  <div><p class="text-4xl font-bold">40</p><p class="text-sm opacity-80 mt-1">Partner farms</p></div>
  <div><p class="text-4xl font-bold">70%</p><p class="text-sm opacity-80 mt-1">Goes to growers</p></div>
  <div><p class="text-4xl font-bold">12k</p><p class="text-sm opacity-80 mt-1">Boxes shipped monthly</p></div>
</section>`,
      },
      {
        type: "testimonials",
        html: `<section class="bg-[#f4f1e8] px-10 py-16 text-center">
  <p class="text-xl text-[#3f4f3d] max-w-2xl mx-auto leading-relaxed">"I know the name of the farmer who grew my oats. That changed how I cook, honestly."</p>
  <p class="text-[#5c6b57] mt-4 text-sm">— Rosa T., subscriber since 2022</p>
</section>`,
      },
      {
        type: "cta",
        html: `<section class="bg-[#e7e3d3] px-10 py-16 text-center">
  <h2 class="text-3xl font-bold text-[#3f4f3d] mb-6">Get the harvest box, monthly.</h2>
  <button class="bg-[#3f4f3d] text-[#f4f1e8] font-semibold px-8 py-4 rounded-full">Start subscription — $34/mo</button>
</section>`,
      },
      {
        type: "footer",
        html: `<footer class="bg-[#3f4f3d] text-[#c9c2a3] px-10 py-8 flex justify-between text-sm rounded-t-3xl mx-6">
  <span>© Field Goods Co.</span>
  <div class="flex gap-6"><span>Our Farms</span><span>FAQ</span></div>
</footer>`,
      },
    ],
  },
];

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  let succeeded = 0;

  for (const d of DESIGNS) {
    const violations = d.sections
      .map((s) => findSafetyViolation(s.html))
      .filter(Boolean);
    if (violations.length > 0) {
      console.error(`SKIPPED "${d.name}":`, violations);
      continue;
    }

    const fullHtml = assembleStandaloneHtml(
      d.name,
      d.sections.map((s) => ({ html: s.html, fontToken: d.font_token }))
    );

    const [design] = await sql`
      insert into designs (batch_date, name, style_summary, layout_notes, full_html)
      values (${today}, ${d.name}, ${d.style_summary}, ${d.layout_notes}, ${fullHtml})
      returning id
    `;

    for (let i = 0; i < d.sections.length; i++) {
      const s = d.sections[i];
      await sql`
        insert into sections (design_id, type, html, order_index, font_token)
        values (${design.id}, ${s.type}, ${s.html}, ${i}, ${d.font_token})
      `;
    }

    console.log(`Inserted "${d.name}" (${d.sections.length} sections)`);
    succeeded += 1;
  }

  await sql`
    insert into generation_runs (status, batch_date, requested_count, succeeded_count, failed_count, notes)
    values ('completed', ${today}, ${DESIGNS.length}, ${succeeded}, ${DESIGNS.length - succeeded}, 'manual seed via scripts/seed-designs.mjs, not the Anthropic API')
  `;

  console.log(`Done: ${succeeded}/${DESIGNS.length} designs inserted.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
