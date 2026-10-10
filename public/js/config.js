// Configuration and PQC cryptographic constants
window.PQC_CONFIG = {
  POLICIES: {
    HYBRID_PERMISSIVE: {
      id: 'hybrid_permissive',
      name: 'Hybrid Permissive (Recommended)',
      description: 'Allows Hybrid PQC and alerts on classical legacy sites.',
      allowClassical: true,
      requirePqc: false
    },
    STRICT_PQC: {
      id: 'strict_pqc',
      name: 'Strict Post-Quantum Only',
      description: 'Blocks classical connections vulnerable to Harvest-Now-Decrypt-Later.',
      allowClassical: false,
      requirePqc: true
    },
    LEGACY_COMPAT: {
      id: 'legacy_compat',
      name: 'Legacy Compatibility Mode',
      description: 'Permits classical connections with minimal warnings.',
      allowClassical: true,
      requirePqc: false
    }
  },

  ALGORITHMS: {
    KEM: {
      'ML-KEM-512': { family: 'Kyber', level: 1, pk: 800, ct: 768, energy_uj: 18.5 },
      'ML-KEM-768': { family: 'Kyber', level: 3, pk: 1184, ct: 1088, energy_uj: 29.8 },
      'ML-KEM-1024': { family: 'Kyber', level: 5, pk: 1568, ct: 1568, energy_uj: 44.2 },
      'X25519MLKEM768': { family: 'Hybrid Kyber', level: 3, pk: 1216, ct: 1120, energy_uj: 38.6 },
      'X25519': { family: 'Classical ECC', level: 0, pk: 32, ct: 32, energy_uj: 12.1 },
      'RSA-3072': { family: 'Classical RSA', level: 0, pk: 384, ct: 384, energy_uj: 310.0 }
    },
    SIG: {
      'ML-DSA-44': { family: 'Dilithium', level: 2, pk: 1312, sig: 2420, energy_uj: 62.0 },
      'ML-DSA-65': { family: 'Dilithium', level: 3, pk: 1952, sig: 3309, energy_uj: 95.4 },
      'ML-DSA-87': { family: 'Dilithium', level: 5, pk: 2592, sig: 4627, energy_uj: 148.0 },
      'Falcon-512': { family: 'Falcon', level: 1, pk: 897, sig: 666, energy_uj: 48.0 },
      'ECDSA-P256': { family: 'Classical ECC', level: 0, pk: 64, sig: 64, energy_uj: 22.0 },
      'RSA-2048': { family: 'Classical RSA', level: 0, pk: 256, sig: 256, energy_uj: 195.0 }
    }
  },

  DEFAULT_URL: 'pq.cloudflareresearch.com'
};
