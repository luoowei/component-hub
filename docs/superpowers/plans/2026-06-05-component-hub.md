# component-hub Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Build a multi-language WASM component registry and marketplace on the warg protocol.

**Architecture:** Registry layer (warg protocol) + Marketplace layer (search, provenance, audit, payments).

**Tech Stack:** Node.js 20+, ESM, `node --test`. AGPL-3.0.

---

### Task 1: Core Registry Engine

- [x] Publish components with namespace/name/version, WIT interfaces, language metadata
- [x] Semantic search: query by name, language, WIT interface type
- [x] Component statistics: total components, total versions, total interfaces
- [x] Interface usage tracking: which components implement which WIT interfaces
- [x] Duplicate version prevention

### Task 2: Storage Backend

- [x] PostgreSQL-backed component metadata store
- [x] Content-addressed blob storage (S3-compatible or local filesystem)
- [x] warg protocol adapter for package storage

### Task 3: Search and Discovery

- [x] Web UI for browsing and searching components
- [x] WIT interface dependency graph visualization
- [x] Usage statistics and popularity ranking

### Task 4: Security and Provenance

- [x] Signature verification on publish
- [x] SLSA provenance attestation
- [x] SAST scanning pipeline (sandbox execution, SBOM generation)

### Task 5: Monetization Layer

- [x] Stripe Connect integration for paid components
- [x] Private organization registries ($29-199/month)
- [x] Security audit certification ($99-499/component/year)

### Task 6: Release Assets

- [x] README + README.zh-CN with quick-start
- [x] GitHub Actions CI
- [x] Docker image for self-hosted deployment
- [x] LAUNCH.md with channel plan
