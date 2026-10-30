# Contributing to C2Vector

Thank you for your interest in contributing to **C2Vector**! We welcome bug fixes, performance optimizations, accessibility improvements, and documentation enhancements.

---

## 🧭 Core Principles

Before proposing any changes, please keep in mind the foundational principles of C2Vector:

1. **100% Deterministic & 0% Generative AI:**
   - C2Vector does not use machine learning models or generative AI wrappers. All features must rely on deterministic computer vision, numerical analysis, and geometric algorithms.
2. **100% Client-Side Privacy:**
   - Zero user data, photos, or vector geometry may be sent across the network. All computational processing must execute in client browser memory / Web Workers.
3. **Zero Heavy Toolchains:**
   - Core runtime code must remain native ES Modules and modern Web standards without forcing heavy bundlers or complex framework compilation.

---

## 🛠️ Development Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/deekshithvodela/c2vector.git
   cd c2vector
   ```
2. **Start the Local Development Server:**
   ```bash
   node c2vector/server.js
   ```
   Open `http://localhost:8080/` in your browser.

---

## 📐 Code Style & Quality Standards

All pull requests must adhere to our zero-diagnostic quality policy:

- **HTML Standards:**
  - Every `<button>` must have an explicit `type="button"` (or `type="submit"` where applicable).
  - All decorative `<svg>` icons must include `aria-hidden="true"`.
  - HTML attribute values must escape ampersands properly (e.g., `&amp;display=swap`).
  - Use clean directory endpoints (`/about/`, `/workflow/`) without trailing `.html` extensions.
- **CSS Standards:**
  - Vendor-prefixed properties like `-webkit-background-clip: text;` must always be paired with the standard W3C property `background-clip: text;`.
  - Maintain the official golden yellow (`#f4ba00`, `#fedd3d`, `#fbd32c`) and obsidian/charcoal palette.
  - Zero layout shift ($\Delta Y = 0.00\text{px}$) across viewports.
- **JavaScript Standards:**
  - Use ES2019+ optional catch binding (`try { ... } catch { ... }`) when the error object is unused.
  - Never introduce unescaped `innerHTML` sinks or `eval()` calls.
  - Keep CPU-heavy image processing inside Web Workers (`worker.js`).

---

## 🧪 Testing & Verification

Before submitting a PR, verify that all automated verification suites pass:

```bash
# Verify AST diagnostics, button types, SVG accessibility, and HTTPS protocols:
node scripts/verify_phase28.mjs

# Verify Clean URLs, OpenGraph asset sizes (<100KB), and headless browser navigation:
node scripts/verify_phase27.mjs
```

---

## 📬 Pull Request Process

1. Fork the repo and create a feature branch (`git checkout -b feat/your-feature-name`).
2. Make your targeted, minimal changes respecting the architecture.
3. Run the verification test suites to confirm zero regressions.
4. Commit your changes with clear, descriptive commit messages.
5. Push to your fork and submit a Pull Request against the `main` branch.
