/**
 * Component Registry — semantic search, provenance, security scoring.
 */
export class ComponentRegistry {
  constructor() {
    this.components = new Map(); // namespace/name -> versions[]
    this.interfaces = new Map(); // WIT interface name -> component refs
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
    return entry;
  }

  search({ query, language, _interface }) {
    let results = [];
    for (const [id, versions] of this.components) {
      const latest = versions[versions.length - 1];
      let match = false;
      if (query && (id.toLowerCase().includes(query.toLowerCase()) || latest.name.toLowerCase().includes(query.toLowerCase()))) match = true;
      if (language && latest.language === language) match = true;
      if (_interface && latest.witInterfaces?.includes(_interface)) match = true;
      if (match) results.push({ id, versions: versions.length, latest: latest.version, language: latest.language, interfaces: latest.witInterfaces });
    }
    return results;
  }

  getVersions(namespace, name) {
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
