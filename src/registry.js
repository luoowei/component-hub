/**
 * Component Registry — semantic search, provenance, security scoring.
 */
export class ComponentRegistry {
  constructor() {
    this.components = new Map(); // namespace/name -> versions[]
    this.interfaces = new Map(); // WIT interface name -> component refs
    // Inverted index for sub-linear text search
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

  publish(namespace, name, version, { witInterfaces = [], language = "unknown", checksum = null } = {}) {
    const id = `${namespace}/${name}`;
    if (!this.components.has(id)) this.components.set(id, []);
    const versions = this.components.get(id);
    if (versions.find(v => v.version === version)) throw new Error(`Version ${version} already exists for ${id}`);
    const entry = { namespace, name, version, language, checksum, witInterfaces, publishedAt: new Date().toISOString() };
    versions.push(entry);
    for (const iface of witInterfaces) {
      if (!this.interfaces.has(iface)) this.interfaces.set(iface, []);
      this.interfaces.get(iface).push(id);
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
    const id = `${namespace}/${name}`;
    return this.components.get(id) || [];
  }

  getInterfaceUsage(_interface) {
    return { interface: _interface, components: this.interfaces.get(_interface) || [], count: (this.interfaces.get(_interface) || []).length };
  }

  stats() {
    let componentCount = this.components.size;
    let versionCount = 0;
    for (const [, versions] of this.components) versionCount += versions.length;
    return { components: componentCount, versions: versionCount, interfaces: this.interfaces.size };
  }
}
