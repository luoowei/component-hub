/**
 * Component Registry — semantic search, provenance, security scoring.
 */
export class ComponentRegistry {
  constructor() {
    this.components = new Map(); // namespace/name -> versions[]
    this.interfaces = new Map(); // WIT interface name -> component refs (implemented)
    this.dependencies = new Map(); // name/name -> Set<dependent namespace/name>
    this._termIndex = new Map(); // term -> Set<id>
  }

  _indexComponent(id, metadata) {
    const terms = new Set();
    const addTerms = (str) => {
      if (!str) return;
      for (const t of str.toLowerCase().split(/[/\-_\s]+/)) {
        if (t.length >= 2) terms.add(t);
      }
    };
    addTerms(id);
    addTerms(metadata.name);
    addTerms(metadata.language);
    for (const iface of metadata.witInterfaces || []) addTerms(iface);
    for (const term of terms) {
      if (!this._termIndex.has(term)) this._termIndex.set(term, new Set());
      this._termIndex.get(term).add(id);
    }
  }

  publish(namespace, name, version, { witInterfaces = [], witDependencies = [], language = "unknown", checksum = null } = {}) {
    const id = `${namespace}/${name}`;
    if (!this.components.has(id)) this.components.set(id, []);
    const versions = this.components.get(id);
    if (versions.find(v => v.version === version)) throw new Error(`Version ${version} already exists for ${id}`);
    const entry = { namespace, name, version, language, checksum, witInterfaces, witDependencies, publishedAt: new Date().toISOString() };
    versions.push(entry);
    for (const iface of witInterfaces) {
      if (!this.interfaces.has(iface)) this.interfaces.set(iface, []);
      this.interfaces.get(iface).push(id);
    }
    // Track reverse dependencies
    for (const dep of witDependencies) {
      if (!this.dependencies.has(dep)) this.dependencies.set(dep, new Set());
      this.dependencies.get(dep).add(id);
    }
    this._indexComponent(id, entry);
    return entry;
  }

  /**
   * Search components using the inverted index (sub-linear).
   * Falls back to full scan for language/interface filters.
   */
  search({ query, language, _interface }) {
    let candidateIds = null;

    // Use inverted index for text queries
    if (query) {
      const terms = query.toLowerCase().split(/[/\-_\s]+/).filter(t => t.length >= 2);
      for (const term of terms) {
        const matches = this._termIndex.get(term) || new Set();
        if (candidateIds === null) {
          candidateIds = new Set(matches);
        } else {
          candidateIds = new Set([...candidateIds].filter(id => matches.has(id)));
        }
      }
    }

    // Also try prefix match against term index keys
    if (query && (!candidateIds || candidateIds.size === 0)) {
      const prefix = query.toLowerCase();
      candidateIds = new Set();
      for (const [term, ids] of this._termIndex) {
        if (term.startsWith(prefix) || prefix.startsWith(term)) {
          for (const id of ids) candidateIds.add(id);
        }
      }
    }

    const results = [];
    for (const [id, versions] of this.components) {
      // Skip if inverted index is active and this component doesn't match
      if (candidateIds !== null && !candidateIds.has(id)) continue;

      const latest = versions[versions.length - 1];
      if (language && latest.language !== language) continue;
      if (_interface && !latest.witInterfaces?.includes(_interface)) continue;

      results.push({
        id,
        versions: versions.length,
        latest: latest.version,
        language: latest.language,
        interfaces: latest.witInterfaces,
      });
    }
    return results;
  }

  /**
   * Get versions sorted by semver (descending) or insertion order if comparisons fail.
   */
  getVersions(namespace, name) {
    const id = `${namespace}/${name}`;
    const versions = this.components.get(id) || [];
    return [...versions].sort((a, b) => {
      const cmp = semverCompare(a.version, b.version);
      return cmp !== 0 ? -cmp : 0; // descending
    });
  }

  /**
   * Return the latest stable version (non-prerelease), or the latest version if all are prereleases.
   */
  latestStable(namespace, name) {
    const versions = this.getVersions(namespace, name);
    const stable = versions.filter(v => !isPrerelease(v.version));
    return stable.length > 0 ? stable[0] : (versions.length > 0 ? versions[0] : null);
  }

  /**
   * Get components that depend on this namespace/name.
   */
  getDependents(namespace, name) {
    const id = `${namespace}/${name}`;
    return [...(this.dependencies.get(id) || [])];
  }

  /**
   * Get the WIT dependencies of the latest version of a component.
   */
  getDependencies(namespace, name) {
    const versions = this.getVersions(namespace, name);
    return versions.length > 0 ? (versions[0].witDependencies || []) : [];
  }

  getInterfaceUsage(_interface) {
    return { interface: _interface, components: this.interfaces.get(_interface) || [], count: (this.interfaces.get(_interface) || []).length };
  }

  stats() {
    let componentCount = this.components.size;
    let versionCount = 0;
    for (const [, versions] of this.components) versionCount += versions.length;
    const depCount = [...this.dependencies.values()].reduce((s, set) => s + set.size, 0);
    return { components: componentCount, versions: versionCount, interfaces: this.interfaces.size, dependencies: depCount };
  }
}

// ---------------------------------------------------------------------------
// Semver helpers (zero-dependency, subset of semver.org spec)
// ---------------------------------------------------------------------------

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;

function semverCompare(a, b) {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa && !pb) return a.localeCompare(b);
  if (!pa) return -1;
  if (!pb) return 1;

  // Compare major.minor.patch
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;

  // Pre-release: a version with pre-release is LOWER than one without
  if (pa.prerelease && !pb.prerelease) return -1;
  if (!pa.prerelease && pb.prerelease) return 1;
  if (pa.prerelease && pb.prerelease) {
    return comparePrerelease(pa.prerelease, pb.prerelease);
  }

  return 0;
}

function parseSemver(v) {
  const m = v.match(SEMVER_RE);
  if (!m) return null;
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: parseInt(m[3], 10),
    prerelease: m[4] ? m[4].split(".") : null,
  };
}

function comparePrerelease(a, b) {
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai === undefined) return -1; // shorter = smaller
    if (bi === undefined) return 1;
    const aiNum = parseInt(ai, 10);
    const biNum = parseInt(bi, 10);
    if (!isNaN(aiNum) && !isNaN(biNum)) {
      if (aiNum !== biNum) return aiNum - biNum;
    } else {
      const cmp = ai.localeCompare(bi);
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

function isPrerelease(v) {
  const m = v.match(SEMVER_RE);
  return m ? !!m[4] : false;
}
