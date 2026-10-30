# Security Policy

## 🛡️ Security Architecture & Privacy Guarantee

**C2Vector** is engineered from the ground up as a **100% client-side Progressive Web Application (PWA)**. 

### Core Security Guarantees:
1. **Zero Server Uploads:** Your photographs, corporate logos, vector paths, and compiled PDFs never travel over the network to any remote server or cloud bucket. All calculations execute locally inside your browser's native Web Worker threads.
2. **Ephemeral Memory:** In-memory image buffers, canvas data, and vector streams exist solely within browser memory and are automatically reclaimed when the session tab is closed or reloaded.
3. **Zero XSS Sinks:** The application avoids dynamic evaluation (`eval`, `document.write`) and raw DOM string sinks (`innerHTML` on unsanitized inputs), using safe DOM manipulation APIs (`classList`, `setAttribute`).
4. **Zero Third-Party Ad Trackers:** C2Vector sets zero advertising cookies, fingerprinting pixels, or invasive telemetry. Anonymous, privacy-first page counting is handled via GoatCounter without logging Personal Identifiable Information (PII).

---

## 🔒 Supported Versions

Only the current version hosted on the `main` branch and served via GitHub Pages is actively maintained with security patches.

| Version | Supported |
|---|---|
| Latest `main` / `c2vector-v6` | ✅ Yes |
| Historical / Pre-v6 releases | ❌ No |

---

## 🚨 Reporting a Vulnerability

If you discover a potential security vulnerability or privacy flaw in C2Vector:

1. **Do not create a public GitHub Issue.**
2. Please submit a private advisory through **[GitHub Security Advisories](https://github.com/deekshithvodela/c2vector/security/advisories)** or contact the maintainer directly:
   - **Author:** Deekshith Vodela
   - **Contact:** Open a private issue on GitHub or reach out via [LinkedIn](https://www.linkedin.com/in/deekshithvodela/).

Please include:
- A clear description of the vulnerability and its potential impact.
- Step-by-step reproduction instructions or proof-of-concept code.
- Your browser version, operating system, and hardware environment.

We aim to acknowledge reports within 48 hours and coordinate a fix prior to public disclosure.
