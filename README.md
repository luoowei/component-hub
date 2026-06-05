# component-hub

Multi-language WASM component registry and marketplace on the warg protocol (Bytecode Alliance).

```bash
npx --yes git+https://github.com/luoowei/component-hub.git
```

## Why

WASI 0.2 Component Model stable since Jan 2024. WASI 0.3 async I/O RC Nov 2025. warg registry exists as protocol but no marketplace layer — no Web UI, no search, no monetization, no security review. n8n ($2.5B) had 4 CVSS 9.4+ CVEs in 90 days from plugin security gaps — every plugin could be a WASM sandbox.

## What it does

- Semantic search by WIT interface type, language, capability
- Content-addressed storage with signature verification
- Provenance attestation (SLSA, reproducible builds)
- Security audit pipeline (SAST + sandbox execution)
- Public components free, private org $29-199/month

## License

AGPL-3.0
