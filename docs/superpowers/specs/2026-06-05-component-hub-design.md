# component-hub Design Specification

## Overview

`component-hub` is a multi-language WASM component registry and marketplace. Built on the warg protocol (Bytecode Alliance), it provides discovery, semantic search, versioning, security auditing, and monetization for WASM components with WIT interfaces.

## Motivation

WASI 0.2 Component Model stable since Jan 2024 (2.5 years). WASI 0.3 async I/O RC Nov 2025. warg registry exists as a protocol but has no marketplace layer — no Web UI, no search, no monetization, no security review pipeline. n8n ($2.5B valuation) had 4 CVSS 9.4+ CVEs in 90 days from plugin security gaps — every plugin could be a WASM sandbox. This is Docker Hub 2013 moment.

## Architecture

```
Web UI (search / browse / publish)
    │
    ▼
┌─────────────────────────────────────┐
│  component-hub marketplace layer     │
│  ├─ Semantic search (WIT interface)  │
│  ├─ Quality signals (provenance)     │
│  ├─ Security audit (SAST + sandbox)  │
│  ├─ Monetization (Stripe Connect)    │
│  └─ Private registry (org/team)      │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  warg protocol layer (Bytecode)     │
│  ├─ Log-based immutable registry    │
│  ├─ Content-addressed storage       │
│  └─ Federation protocol             │
└─────────────────────────────────────┘
```

### Core features

- **Semantic search**: index WIT interface types, component capabilities, language support
- **Provenance attestation**: signature verification, SLSA provenance, reproducible builds
- **Security pipeline**: SAST scan on upload, sandbox execution verification, SBOM generation
- **Pricing**: public free, private org $29-199/mo, security audit $99-499/component/year

## Distribution

Single binary (Go or Node.js), Docker image. Backed by PostgreSQL for metadata, warg protocol for package storage.

## License

AGPL-3.0
