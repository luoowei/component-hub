import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ComponentRegistry } from "../src/registry.js";

describe("ComponentRegistry", () => {
  it("publishes and retrieves components", () => {
    const reg = new ComponentRegistry();
    reg.publish("myorg", "logger", "1.0.0", { language: "rust", witInterfaces: ["wasi:logging"] });
    const results = reg.search({ query: "logger" });
    assert.equal(results.length, 1);
    assert.equal(results[0].id, "myorg/logger");
    assert.equal(results[0].language, "rust");
  });

  it("finds components by WIT interface", () => {
    const reg = new ComponentRegistry();
    reg.publish("a", "http", "1.0.0", { language: "go", witInterfaces: ["wasi:http"] });
    reg.publish("b", "proxy", "1.0.0", { language: "rust", witInterfaces: ["wasi:http", "wasi:logging"] });
    const results = reg.search({ _interface: "wasi:http" });
    assert.equal(results.length, 2);
  });

  it("prevents duplicate versions", () => {
    const reg = new ComponentRegistry();
    reg.publish("org", "lib", "1.0.0");
    assert.throws(() => reg.publish("org", "lib", "1.0.0"));
  });

  it("tracks component statistics", () => {
    const reg = new ComponentRegistry();
    reg.publish("a", "x", "1.0.0");
    reg.publish("a", "x", "2.0.0");
    reg.publish("b", "y", "1.0.0");
    assert.equal(reg.stats().components, 2);
    assert.equal(reg.stats().versions, 3);
  });

  it("returns interface usage", () => {
    const reg = new ComponentRegistry();
    reg.publish("a", "x", "1.0.0", { witInterfaces: ["wasi:http"] });
    const usage = reg.getInterfaceUsage("wasi:http");
    assert.equal(usage.count, 1);
    assert.ok(usage.components.includes("a/x"));
  });
});
