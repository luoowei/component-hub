/**
 * Signature verification and SLSA provenance attestation.
 */
import { createVerify, createHash } from "node:crypto";

export function verifySignature({ publicKey, data, signature, algorithm = "sha256" }) {
  try {
    const verifier = createVerify(algorithm);
    verifier.update(JSON.stringify(data));
    return verifier.verify(publicKey, signature, "base64");
  } catch {
    return false;
  }
}

export function buildAttestation({ subject, builder, sourceRepo, digest, buildTimestamp }) {
  return {
    _type: "https://in-toto.io/Statement/v1",
    subject: [{ name: subject, digest: { sha256: digest } }],
    predicateType: "https://slsa.dev/provenance/v1",
    predicate: {
      buildDefinition: { buildType: "https://component-hub.dev/wasm/v1", resolvedDependencies: [] },
      runDetails: { builder: { id: builder }, buildMetadata: { invocationId: createHash("sha256").update(sourceRepo + buildTimestamp).digest("hex").slice(0, 16) } },
    },
  };
}

export function computeDigest(content) {
  return "sha256:" + createHash("sha256").update(content).digest("hex");
}
