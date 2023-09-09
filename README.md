# DIDComm Browser Demo

## Secrets stored in the browser per profile

Secrets are stored in the browser under profiles. The profile data looks like:

```json
{
  "secrets": [
    {
      "id": "did:example:charlie#key-1",
      "type": "JsonWebKey2020",
      "privateKeyJwk": {
        "crv": "Ed25519",
        "d": "T2azVap7CYD_kB8ilbnFYqwwYb5N-GcD6yjGEvquZXg",
        "kty": "OKP",
        "x": "VDXDwuGKVq91zxU6q7__jLDUq8_C5cuxECgd-1feFTE"
      }
    },
    {
      "id": "did:example:charlie#key-2",
      "type": "JsonWebKey2020",
      "privateKeyJwk": {
        "crv": "Ed25519",
        "d": "T2azVap7CYD_kB8ilbnFYqwwYb5N-GcD6yjGEvquZXg",
        "kty": "OKP",
        "x": "VDXDwuGKVq91zxU6q7__jLDUq8_C5cuxECgd-1feFTE"
      }
    }
  ]
}
```
