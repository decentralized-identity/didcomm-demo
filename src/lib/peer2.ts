import * as multibase from "multibase"
import * as multicodec from "multicodec"

// Common string abbreviation mappings
const commonStringAbbreviations: Record<string, string> = {
  type: "t",
  DIDCommMessaging: "dm",
  serviceEndpoint: "s",
  routingKeys: "r",
  accept: "a",
}

const reverseCommonStringAbbreviations: Record<string, string> = Object.entries(
  commonStringAbbreviations
).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {})

// Purpose code mappings
const purposeCodeList: Record<string, string> = {
  Assertion: "A",
  Encryption: "E",
  Verification: "V",
  "Capability Invocation": "I",
  "Capability Delegation": "D",
  Service: "S",
}

export default class DIDPeer {
  static keyToMultibase(key: Uint8Array, prefix: multicodec.CodecName): string {
    const buffer = multibase.encode(
      "base58btc",
      multicodec.addPrefix(prefix, key)
    )
    return String.fromCharCode(...buffer)
  }

  static base64UrlEncode(input: string): string {
    let base64 = btoa(input)
    return base64.replace("+", "-").replace("/", "_").replace(/=+$/, "") // remove trailing '=' characters
  }

  static base64UrlDecode(input: string): string {
    // Replace URL-safe characters back to Base64 characters
    let base64 = input.replace("-", "+").replace("_", "/")

    // Add padding if necessary
    switch (base64.length % 4) {
      case 2:
        base64 += "=="
        break // 2 padding chars
      case 3:
        base64 += "="
        break // 1 padding char
    }

    return atob(base64)
  }

  // Determine ident for key
  static keyToIdent(key: Uint8Array, prefix: multicodec.CodecName): string {
    const encoded = DIDPeer.keyToMultibase(key, prefix)
    return encoded.toString().slice(1, 9)
  }

  // Generate a DID
  static generate(
    signingKeys: Uint8Array[],
    encryptionKeys: Uint8Array[],
    serviceBlock: object
  ): string {
    const didPrefix = "did:peer:2"

    // Encode keys
    const encodedSigningKeys = signingKeys.map(key => {
      const encoded = DIDPeer.keyToMultibase(key, "ed25519-pub")
      return "." + purposeCodeList["Verification"] + encoded
    })

    const encodedEncryptionKeys = encryptionKeys.map(key => {
      const encoded = DIDPeer.keyToMultibase(key, "x25519-pub")
      return "." + purposeCodeList["Encryption"] + encoded.toString()
    })

    // Encode service block
    let abbreviatedService = JSON.stringify(
      DIDPeer.abbreviateCommonStrings(serviceBlock)
    )
    abbreviatedService = abbreviatedService.replace(/\s+/g, "")
    const encodedService = DIDPeer.base64UrlEncode(abbreviatedService)
    const finalService = "." + purposeCodeList["Service"] + encodedService

    return (
      didPrefix +
      encodedSigningKeys.join("") +
      encodedEncryptionKeys.join("") +
      finalService
    )
  }

  static transformOldServiceStyleToNew(service: any): any {
    if (typeof service.serviceEndpoint === "string") {
      const endpoint = service.serviceEndpoint
      service.serviceEndpoint = {
        uri: endpoint,
        routingKeys: service.routingKeys || [],
        accept: service.accept || ["didcomm/v2"],
      }
      delete service.routingKeys
      delete service.accept
    }
    return service
  }

  static expandCommonStringAbbreviations(input: any): any {
    const expanded = Object.fromEntries(
      Object.entries(input).map(([key, value]) => {
        const expandedKey = reverseCommonStringAbbreviations[key] || key
        let expandedValue = value;
        if (typeof value == "string") {
          expandedValue = reverseCommonStringAbbreviations[value] || value
        } else if (Array.isArray(value)) {
          expandedValue = value.map((item: any) => reverseCommonStringAbbreviations[item] || item)
        } else if (typeof value == "object") {
          expandedValue = DIDPeer.expandCommonStringAbbreviations(expandedValue)
        }
        return [expandedKey, expandedValue]
      })
    )
    return expanded
  }

  static abbreviateCommonStrings(input: any): any {
    const abbreviated = Object.fromEntries(
      Object.entries(input).map(([key, value]) => {
        const abbreviatedKey = commonStringAbbreviations[key] || key
        let abbreviatedValue = value
        if (typeof value == "string") {
          abbreviatedValue = commonStringAbbreviations[value] || value
        } else if (Array.isArray(value)) {
          abbreviatedValue = value.map((item: any) => commonStringAbbreviations[item] || item)
        } else if (typeof value == "object") {
          abbreviatedValue = DIDPeer.abbreviateCommonStrings(abbreviatedValue)
        }
        return [abbreviatedKey, abbreviatedValue]
      })
    )
    return abbreviated
  }

  // Resolve a DID into a DID Document
  static resolve(did: string) {
    if (!did.startsWith("did:peer:2")) {
      throw new Error("Invalid did:peer:2")
    }

    const [, ...elements] = did.split(".")

    const doc: any = {
      "@context": "https://www.w3.org/ns/did/v1",
      id: did,
    }
    let serviceIndex = 0;
    let keyIndex = 1;

    elements.forEach(element => {
      const purposeCode = element.charAt(0)
      const encodedValue = element.slice(1)

      switch (purposeCode) {
        case purposeCodeList["Verification"]: {
          const decodedSigningKey = multicodec.rmPrefix(
            multibase.decode(encodedValue)
          )
          if (!doc.authentication) {
            doc.authentication = []
          }
          if (!doc.verificationMethod) {
            doc.verificationMethod = []
          }
          let ident = `${did}#key-${keyIndex++}`
          doc.verificationMethod.push({
            id: ident,
            controller: did,
            type: "Ed25519VerificationKey2020",
            publicKeyMultibase: DIDPeer.keyToMultibase(
              decodedSigningKey,
              "ed25519-pub"
            ),
          })
          doc.authentication.push(ident)
          break
        }

        case purposeCodeList["Encryption"]: {
          const decodedEncryptionKey = multicodec.rmPrefix(
            multibase.decode(encodedValue)
          )
          if (!doc.keyAgreement) {
            doc.keyAgreement = []
          }
          if (!doc.verificationMethod) {
            doc.verificationMethod = []
          }
          let ident = `${did}#key-${keyIndex++}`
          doc.verificationMethod.push({
            id: ident,
            controller: did,
            type: "X25519KeyAgreementKey2020",
            publicKeyMultibase: DIDPeer.keyToMultibase(
              decodedEncryptionKey,
              "x25519-pub"
            ),
          })
          doc.keyAgreement.push(ident)
          break
        }

        case purposeCodeList["Service"]: {
          const decodedService = DIDPeer.base64UrlDecode(encodedValue)
          let services = JSON.parse(decodedService)
          if (!Array.isArray(services)) {
            services = [services]
          }
          services = services
            .map(DIDPeer.expandCommonStringAbbreviations)
            .map((service: any) => {
              // TODO This is a bandaid! Mediator should include id in services.
              if (!("id" in service)) {
                let suffix = serviceIndex++ > 0 ? "" : `-${serviceIndex}`
                service.id = `#service${suffix}`
              }
              return service
            })
            .map(DIDPeer.transformOldServiceStyleToNew)
            .filter((service: any) => {return service.type == "DIDCommMessaging"})
          services = services.filter((service: any) => service.type == "DIDCommMessaging")

          if (!Array.isArray(doc.service)) {
            doc.service = [];
          }
          doc.service = doc.service.concat(services)
          break
        }

        default:
          // Other purpose codes can be handled here
          break
      }
    })
    return doc
  }
}
