/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/lib/didcomm.ts":
/*!****************************!*\
  !*** ./src/lib/didcomm.ts ***!
  \****************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DIDComm: () => (/* binding */ DIDComm),
/* harmony export */   DIDPeerResolver: () => (/* binding */ DIDPeerResolver),
/* harmony export */   EphemeralSecretsResolver: () => (/* binding */ EphemeralSecretsResolver),
/* harmony export */   LocalSecretsResolver: () => (/* binding */ LocalSecretsResolver),
/* harmony export */   generateDid: () => (/* binding */ generateDid),
/* harmony export */   generateDidForMediator: () => (/* binding */ generateDidForMediator)
/* harmony export */ });
/* harmony import */ var _noble_curves_ed25519__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @noble/curves/ed25519 */ "./node_modules/@noble/curves/esm/ed25519.js");
/* harmony import */ var didcomm__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! didcomm */ "./node_modules/didcomm/index.js");
/* harmony import */ var _peer2__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./peer2 */ "./src/lib/peer2.ts");
/* harmony import */ var uuid__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! uuid */ "./node_modules/uuid/dist/esm-browser/v4.js");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./logger */ "./src/lib/logger.ts");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([didcomm__WEBPACK_IMPORTED_MODULE_0__]);
didcomm__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];





function x25519ToSecret(did, x25519KeyPriv, x25519Key) {
    const encIdent = _peer2__WEBPACK_IMPORTED_MODULE_1__["default"].keyToIdent(x25519Key, "x25519-pub");
    const secretEnc = {
        id: `${did}#${encIdent}`,
        type: "X25519KeyAgreementKey2020",
        privateKeyMultibase: _peer2__WEBPACK_IMPORTED_MODULE_1__["default"].keyToMultibase(x25519KeyPriv, "x25519-priv")
    };
    return secretEnc;
}
function ed25519ToSecret(did, ed25519KeyPriv, ed25519Key) {
    const verIdent = _peer2__WEBPACK_IMPORTED_MODULE_1__["default"].keyToIdent(ed25519Key, "ed25519-pub");
    const secretVer = {
        id: `${did}#${verIdent}`,
        type: "Ed25519VerificationKey2020",
        privateKeyMultibase: _peer2__WEBPACK_IMPORTED_MODULE_1__["default"].keyToMultibase(ed25519KeyPriv, "ed25519-priv")
    };
    return secretVer;
}
function generateDidForMediator() {
    const key = _noble_curves_ed25519__WEBPACK_IMPORTED_MODULE_3__.ed25519.utils.randomPrivateKey();
    const enckeyPriv = (0,_noble_curves_ed25519__WEBPACK_IMPORTED_MODULE_3__.edwardsToMontgomeryPriv)(key);
    const verkey = _noble_curves_ed25519__WEBPACK_IMPORTED_MODULE_3__.ed25519.getPublicKey(key);
    const enckey = (0,_noble_curves_ed25519__WEBPACK_IMPORTED_MODULE_3__.edwardsToMontgomeryPub)(verkey);
    const service = {
        type: "DIDCommMessaging",
        serviceEndpoint: "",
        accept: ["didcomm/v2"],
    };
    const did = _peer2__WEBPACK_IMPORTED_MODULE_1__["default"].generate([verkey], [enckey], service);
    const secretVer = ed25519ToSecret(did, key, verkey);
    const secretEnc = x25519ToSecret(did, enckeyPriv, enckey);
    return { did, secrets: [secretVer, secretEnc] };
}
function generateDid(routingDid) {
    const key = _noble_curves_ed25519__WEBPACK_IMPORTED_MODULE_3__.ed25519.utils.randomPrivateKey();
    const enckeyPriv = (0,_noble_curves_ed25519__WEBPACK_IMPORTED_MODULE_3__.edwardsToMontgomeryPriv)(key);
    const verkey = _noble_curves_ed25519__WEBPACK_IMPORTED_MODULE_3__.ed25519.getPublicKey(key);
    const enckey = (0,_noble_curves_ed25519__WEBPACK_IMPORTED_MODULE_3__.edwardsToMontgomeryPub)(verkey);
    const service = {
        type: "DIDCommMessaging",
        serviceEndpoint: {
            uri: routingDid,
            accept: ["didcomm/v2"],
        },
    };
    const did = _peer2__WEBPACK_IMPORTED_MODULE_1__["default"].generate([verkey], [enckey], service);
    const secretVer = ed25519ToSecret(did, key, verkey);
    const secretEnc = x25519ToSecret(did, enckeyPriv, enckey);
    return { did, secrets: [secretVer, secretEnc] };
}
class DIDPeerResolver {
    async resolve(did) {
        const raw_doc = _peer2__WEBPACK_IMPORTED_MODULE_1__["default"].resolve(did);
        return {
            id: raw_doc.id,
            verificationMethod: raw_doc.verificationMethod,
            authentication: raw_doc.authentication,
            keyAgreement: raw_doc.keyAgreement,
            service: raw_doc.service,
        };
    }
}
class LocalSecretsResolver {
    storageKey = "secretsResolver";
    constructor() {
        // Initialize local storage if it hasn't been done before
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({}));
        }
    }
    static createError(message, name) {
        const e = new Error(message);
        e.name = name;
        return e;
    }
    async get_secret(secret_id) {
        try {
            const secrets = JSON.parse(localStorage.getItem(this.storageKey) || "{}");
            return secrets[secret_id] || null;
        }
        catch (error) {
            throw LocalSecretsResolver.createError("Unable to perform IO operation", "DIDCommIoError");
        }
    }
    async find_secrets(secret_ids) {
        try {
            const secrets = JSON.parse(localStorage.getItem(this.storageKey) || "{}");
            return secret_ids.map(id => secrets[id]).filter(secret => !!secret); // Filter out undefined or null values
        }
        catch (error) {
            throw LocalSecretsResolver.createError("Unable to perform IO operation", "DIDCommIoError");
        }
    }
    // Helper method to store a secret in localStorage
    store_secret(secret) {
        try {
            const secrets = JSON.parse(localStorage.getItem(this.storageKey) || "{}");
            secrets[secret.id] = secret;
            localStorage.setItem(this.storageKey, JSON.stringify(secrets));
        }
        catch (error) {
            throw LocalSecretsResolver.createError("Unable to perform IO operation", "DIDCommIoError");
        }
    }
}
class EphemeralSecretsResolver {
    secrets = {};
    static createError(message, name) {
        const e = new Error(message);
        e.name = name;
        return e;
    }
    async get_secret(secret_id) {
        try {
            return this.secrets[secret_id] || null;
        }
        catch (error) {
            throw EphemeralSecretsResolver.createError("Unable to fetch secret from memory", "DIDCommMemoryError");
        }
    }
    async find_secrets(secret_ids) {
        try {
            return secret_ids.map(id => this.secrets[id]).filter(secret => !!secret).map(secret => secret.id); // Filter out undefined or null values
        }
        catch (error) {
            throw EphemeralSecretsResolver.createError("Unable to fetch secrets from memory", "DIDCommMemoryError");
        }
    }
    // Helper method to store a secret in memory
    store_secret(secret) {
        try {
            this.secrets[secret.id] = secret;
        }
        catch (error) {
            throw EphemeralSecretsResolver.createError("Unable to store secret in memory", "DIDCommMemoryError");
        }
    }
}
class DIDComm {
    resolver;
    secretsResolver;
    constructor() {
        this.resolver = new DIDPeerResolver();
        this.secretsResolver = new EphemeralSecretsResolver();
    }
    async generateDidForMediator() {
        const { did, secrets } = generateDidForMediator();
        secrets.forEach(secret => this.secretsResolver.store_secret(secret));
        return did;
    }
    async generateDid(routingDid) {
        const { did, secrets } = generateDid(routingDid);
        secrets.forEach(secret => this.secretsResolver.store_secret(secret));
        return did;
    }
    async resolve(did) {
        return await this.resolver.resolve(did);
    }
    async resolveDIDCommServices(did) {
        const doc = await this.resolve(did);
        if (!doc) {
            throw new Error("Unable to resolve DID");
        }
        if (!doc.service) {
            throw new Error("No service found");
        }
        const services = doc.service
            .filter(s => s.type === "DIDCommMessaging")
            .filter(s => s.serviceEndpoint.accept.includes("didcomm/v2"));
        return services;
    }
    /**
     * Obtain the first websocket endpoint for a given DID.
     *
     * @param {string} did The DID to obtain the websocket endpoint for
     */
    async wsEndpoint(did) {
        const services = await this.resolveDIDCommServices(did);
        const service = services
            .filter((s) => s.serviceEndpoint.uri.startsWith("ws"))[0];
        return {
            id: service.id,
            service_endpoint: service.serviceEndpoint.uri,
        };
    }
    /**
     * Obtain the first http endpoint for a given DID.
     *
     * @param {string} did The DID to obtain the websocket endpoint for
     */
    async httpEndpoint(did) {
        const services = await this.resolveDIDCommServices(did);
        const service = services
            .filter((s) => s.serviceEndpoint.uri.startsWith("http"))[0];
        return {
            id: service.id,
            service_endpoint: service.serviceEndpoint.uri,
        };
    }
    async prepareMessage(to, from, message) {
        const msg = new didcomm__WEBPACK_IMPORTED_MODULE_0__.Message({
            id: (0,uuid__WEBPACK_IMPORTED_MODULE_4__["default"])(),
            typ: "application/didcomm-plain+json",
            from: from,
            to: [to],
            body: message.body || {},
            created_time: Date.now(),
            ...message,
        });
        const [packed, meta] = await msg.pack_encrypted(to, from, null, this.resolver, this.secretsResolver, { forward: true });
        if (!meta.messaging_service) {
            meta.messaging_service = await this.httpEndpoint(to);
        }
        return [msg.as_value(), packed, meta];
    }
    async unpackMessage(message) {
        return await didcomm__WEBPACK_IMPORTED_MODULE_0__.Message.unpack(message, this.resolver, this.secretsResolver, {});
    }
    async sendMessageAndExpectReply(to, from, message) {
        const [plaintext, packed, meta] = await this.prepareMessage(to, from, message);
        _logger__WEBPACK_IMPORTED_MODULE_2__["default"].sentMessage({ to, from, message: plaintext });
        if (!meta.messaging_service) {
            throw new Error("No messaging service found");
        }
        try {
            const response = await fetch(meta.messaging_service.service_endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/didcomm-encrypted+json"
                },
                body: packed,
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Error sending message: ${text}`);
            }
            _logger__WEBPACK_IMPORTED_MODULE_2__["default"].log("Message sent successfully.");
            const packedResponse = await response.text();
            const unpacked = await this.unpackMessage(packedResponse);
            _logger__WEBPACK_IMPORTED_MODULE_2__["default"].recvMessage({ to, from, message: unpacked[0].as_value() });
            return unpacked;
        }
        catch (error) {
            console.error(error);
        }
    }
    async sendMessage(to, from, message) {
        const [plaintext, packed, meta] = await this.prepareMessage(to, from, message);
        _logger__WEBPACK_IMPORTED_MODULE_2__["default"].sentMessage({ to, from, message: plaintext });
        if (!meta.messaging_service) {
            throw new Error("No messaging service found");
        }
        try {
            const response = await fetch(meta.messaging_service.service_endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/didcomm-encrypted+json"
                },
                body: packed,
            });
            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Error sending message: ${text}`);
            }
            const text = await response.text();
            console.log("Response:", text);
            _logger__WEBPACK_IMPORTED_MODULE_2__["default"].log("Message sent successfully.");
        }
        catch (error) {
            console.error(error);
        }
    }
    async receiveMessage(message) {
        const unpacked = await didcomm__WEBPACK_IMPORTED_MODULE_0__.Message.unpack(message, this.resolver, this.secretsResolver, {});
        const plaintext = unpacked[0].as_value();
        _logger__WEBPACK_IMPORTED_MODULE_2__["default"].recvMessage({ to: plaintext.to[0], from: plaintext.from, message: plaintext });
        return unpacked;
    }
}

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ }),

/***/ "./src/lib/eventbus.ts":
/*!*****************************!*\
  !*** ./src/lib/eventbus.ts ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   EventBus: () => (/* binding */ EventBus),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
class EventBus {
    listeners = [];
    static instance;
    constructor() { }
    static getInstance() {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }
    on(pattern, listener) {
        if (typeof pattern === "string") {
            pattern = new RegExp(pattern);
        }
        let found = false;
        for (const entry of this.listeners) {
            if (entry.pattern.toString() === pattern.toString()) {
                entry.listeners.push(listener);
                found = true;
                break;
            }
        }
        if (!found) {
            this.listeners.push({ pattern: pattern, listeners: [listener] });
        }
    }
    off(pattern, listener) {
        this.listeners = this.listeners.filter(entry => {
            if (entry.pattern.toString() === pattern.toString()) {
                entry.listeners = entry.listeners.filter(l => l !== listener);
                return entry.listeners.length > 0;
            }
            return true;
        });
    }
    async emit(event, ...args) {
        for (const entry of this.listeners) {
            if (entry.pattern.test(event)) {
                for (const listener of entry.listeners) {
                    const result = listener(...args);
                    if (result instanceof Promise) {
                        await result;
                    }
                }
            }
        }
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (EventBus.getInstance());


/***/ }),

/***/ "./src/lib/logger.ts":
/*!***************************!*\
  !*** ./src/lib/logger.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   LogTopic: () => (/* binding */ LogTopic),
/* harmony export */   LoggerService: () => (/* binding */ LoggerService),
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _eventbus__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./eventbus */ "./src/lib/eventbus.ts");

var LogTopic;
(function (LogTopic) {
    LogTopic["LOG"] = "log";
    LogTopic["LOG_MESSAGE"] = "log.message";
    LogTopic["LOG_MESSAGE_CONTACT"] = "log.message.contact";
})(LogTopic || (LogTopic = {}));
class LoggerService {
    records = [];
    log(...messages) {
        console.log(...messages);
        const record = {
            message: messages.join(" "),
            timestamp: new Date(),
            topic: LogTopic.LOG
        };
        this.records.push(record);
        _eventbus__WEBPACK_IMPORTED_MODULE_0__["default"].emit(LogTopic.LOG, record);
    }
    sentMessage(message) {
        const record = {
            message: "Sent: " + JSON.stringify(message.message, null, 2),
            timestamp: new Date(),
            topic: LogTopic.LOG_MESSAGE,
        };
        this.records.push(record);
        _eventbus__WEBPACK_IMPORTED_MODULE_0__["default"].emit(LogTopic.LOG_MESSAGE_CONTACT + `.${message.to}`, record);
    }
    recvMessage(message) {
        const record = {
            message: "Received: " + JSON.stringify(message.message, null, 2),
            timestamp: new Date(),
            topic: LogTopic.LOG_MESSAGE,
        };
        this.records.push(record);
        _eventbus__WEBPACK_IMPORTED_MODULE_0__["default"].emit(LogTopic.LOG_MESSAGE_CONTACT + `.${message.from}`, record);
    }
    subscribe(topic, callback) {
        _eventbus__WEBPACK_IMPORTED_MODULE_0__["default"].on(new RegExp(topic), callback);
    }
    unsubscribe(topic, callback) {
        _eventbus__WEBPACK_IMPORTED_MODULE_0__["default"].off(new RegExp(topic), callback);
    }
    subscribeContact(contact, callback) {
        _eventbus__WEBPACK_IMPORTED_MODULE_0__["default"].on(new RegExp(LogTopic.LOG_MESSAGE_CONTACT + `.${contact}`), callback);
    }
    unsubscribeContact(contact, callback) {
        _eventbus__WEBPACK_IMPORTED_MODULE_0__["default"].off(new RegExp(LogTopic.LOG_MESSAGE_CONTACT + `.${contact}`), callback);
    }
}
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (new LoggerService());


/***/ }),

/***/ "./src/lib/peer2.ts":
/*!**************************!*\
  !*** ./src/lib/peer2.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (/* binding */ DIDPeer)
/* harmony export */ });
/* harmony import */ var multibase__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! multibase */ "./node_modules/multibase/src/index.js");
/* harmony import */ var multibase__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(multibase__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var multicodec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! multicodec */ "./node_modules/multicodec/src/index.js");
/* harmony import */ var multicodec__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(multicodec__WEBPACK_IMPORTED_MODULE_1__);


// Common string abbreviation mappings
const commonStringAbbreviations = {
    type: "t",
    DIDCommMessaging: "dm",
    serviceEndpoint: "s",
    routingKeys: "r",
    accept: "a",
};
const reverseCommonStringAbbreviations = Object.entries(commonStringAbbreviations).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});
// Purpose code mappings
const purposeCodeList = {
    Assertion: "A",
    Encryption: "E",
    Verification: "V",
    "Capability Invocation": "I",
    "Capability Delegation": "D",
    Service: "S",
};
class DIDPeer {
    static keyToMultibase(key, prefix) {
        const buffer = multibase__WEBPACK_IMPORTED_MODULE_0__.encode("base58btc", multicodec__WEBPACK_IMPORTED_MODULE_1__.addPrefix(prefix, key));
        return String.fromCharCode(...buffer);
    }
    static base64UrlEncode(input) {
        let base64 = btoa(input);
        return base64.replace("+", "-").replace("/", "_").replace(/=+$/, ""); // remove trailing '=' characters
    }
    static base64UrlDecode(input) {
        // Replace URL-safe characters back to Base64 characters
        let base64 = input.replace("-", "+").replace("_", "/");
        // Add padding if necessary
        switch (base64.length % 4) {
            case 2:
                base64 += "==";
                break; // 2 padding chars
            case 3:
                base64 += "=";
                break; // 1 padding char
        }
        return atob(base64);
    }
    // Determine ident for key
    static keyToIdent(key, prefix) {
        const encoded = DIDPeer.keyToMultibase(key, prefix);
        return encoded.toString().slice(1, 9);
    }
    // Generate a DID
    static generate(signingKeys, encryptionKeys, serviceBlock) {
        const didPrefix = "did:peer:2";
        // Encode keys
        const encodedSigningKeys = signingKeys.map(key => {
            const encoded = DIDPeer.keyToMultibase(key, "ed25519-pub");
            return "." + purposeCodeList["Verification"] + encoded;
        });
        const encodedEncryptionKeys = encryptionKeys.map(key => {
            const encoded = DIDPeer.keyToMultibase(key, "x25519-pub");
            return "." + purposeCodeList["Encryption"] + encoded.toString();
        });
        // Encode service block
        let abbreviatedService = JSON.stringify(DIDPeer.abbreviateCommonStrings(serviceBlock));
        abbreviatedService = abbreviatedService.replace(/\s+/g, "");
        const encodedService = DIDPeer.base64UrlEncode(abbreviatedService);
        const finalService = "." + purposeCodeList["Service"] + encodedService;
        return (didPrefix +
            encodedSigningKeys.join("") +
            encodedEncryptionKeys.join("") +
            finalService);
    }
    static transformOldServiceStyleToNew(service) {
        if (typeof service.serviceEndpoint === "string") {
            const endpoint = service.serviceEndpoint;
            service.serviceEndpoint = {
                uri: endpoint,
                routingKeys: service.routingKeys || [],
                accept: service.accept || ["didcomm/v2"],
            };
            delete service.routingKeys;
            delete service.accept;
        }
        return service;
    }
    static expandCommonStringAbbreviations(input) {
        const expanded = Object.fromEntries(Object.entries(input).map(([key, value]) => {
            const expandedKey = reverseCommonStringAbbreviations[key] || key;
            const expandedValue = typeof value === 'string'
                ? (reverseCommonStringAbbreviations[value] || value)
                : value;
            return [expandedKey, expandedValue];
        }));
        return expanded;
    }
    static abbreviateCommonStrings(input) {
        const abbreviated = Object.fromEntries(Object.entries(input).map(([key, value]) => {
            const abbreviatedKey = commonStringAbbreviations[key] || key;
            const abbreviatedValue = typeof value === 'string'
                ? (commonStringAbbreviations[value] || value)
                : value;
            return [abbreviatedKey, abbreviatedValue];
        }));
        return abbreviated;
    }
    // Resolve a DID into a DID Document
    static resolve(did) {
        if (!did.startsWith("did:peer:2")) {
            throw new Error("Invalid did:peer:2");
        }
        const [, ...elements] = did.split(".");
        const doc = {
            "@context": "https://www.w3.org/ns/did/v1",
            id: did,
        };
        elements.forEach(element => {
            const purposeCode = element.charAt(0);
            const encodedValue = element.slice(1);
            switch (purposeCode) {
                case purposeCodeList["Verification"]: {
                    const decodedSigningKey = multicodec__WEBPACK_IMPORTED_MODULE_1__.rmPrefix(multibase__WEBPACK_IMPORTED_MODULE_0__.decode(encodedValue));
                    if (!doc.authentication) {
                        doc.authentication = [];
                    }
                    if (!doc.verificationMethod) {
                        doc.verificationMethod = [];
                    }
                    let ident = `${did}#${DIDPeer.keyToIdent(decodedSigningKey, "ed25519-pub")}`;
                    doc.verificationMethod.push({
                        id: ident,
                        controller: did,
                        type: "Ed25519VerificationKey2020",
                        publicKeyMultibase: DIDPeer.keyToMultibase(decodedSigningKey, "ed25519-pub"),
                    });
                    doc.authentication.push(ident);
                    break;
                }
                case purposeCodeList["Encryption"]: {
                    const decodedEncryptionKey = multicodec__WEBPACK_IMPORTED_MODULE_1__.rmPrefix(multibase__WEBPACK_IMPORTED_MODULE_0__.decode(encodedValue));
                    if (!doc.keyAgreement) {
                        doc.keyAgreement = [];
                    }
                    if (!doc.verificationMethod) {
                        doc.verificationMethod = [];
                    }
                    let ident = `${did}#${DIDPeer.keyToIdent(decodedEncryptionKey, "x25519-pub")}`;
                    doc.verificationMethod.push({
                        id: ident,
                        controller: did,
                        type: "X25519KeyAgreementKey2020",
                        publicKeyMultibase: DIDPeer.keyToMultibase(decodedEncryptionKey, "x25519-pub"),
                    });
                    doc.keyAgreement.push(ident);
                    break;
                }
                case purposeCodeList["Service"]: {
                    const decodedService = DIDPeer.base64UrlDecode(encodedValue);
                    let services = JSON.parse(decodedService);
                    if (!Array.isArray(services)) {
                        services = [services];
                    }
                    services = services
                        .map(DIDPeer.expandCommonStringAbbreviations)
                        .map((service) => {
                        // TODO This is a bandaid! Mediator should include id in services.
                        if (!("id" in service)) {
                            service.id = "#service";
                        }
                        return service;
                    })
                        .map(DIDPeer.transformOldServiceStyleToNew);
                    doc.service = services;
                    break;
                }
                default:
                    // Other purpose codes can be handled here
                    break;
            }
        });
        return doc;
    }
}


/***/ }),

/***/ "./src/lib/worker.ts":
/*!***************************!*\
  !*** ./src/lib/worker.ts ***!
  \***************************/
/***/ ((module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.a(module, async (__webpack_handle_async_dependencies__, __webpack_async_result__) => { try {
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _didcomm__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./didcomm */ "./src/lib/didcomm.ts");
/* harmony import */ var _logger__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./logger */ "./src/lib/logger.ts");
var __webpack_async_dependencies__ = __webpack_handle_async_dependencies__([_didcomm__WEBPACK_IMPORTED_MODULE_0__]);
_didcomm__WEBPACK_IMPORTED_MODULE_0__ = (__webpack_async_dependencies__.then ? (await __webpack_async_dependencies__)() : __webpack_async_dependencies__)[0];


const ctx = self;
class DIDCommWorker {
    didcomm;
    didForMediator;
    did;
    ws;
    onLog(record) {
        this.postMessage({ type: "log", payload: record });
    }
    init() {
        _logger__WEBPACK_IMPORTED_MODULE_1__["default"].subscribe(_logger__WEBPACK_IMPORTED_MODULE_1__.LogTopic.LOG, this.onLog.bind(this));
        this.didcomm = new _didcomm__WEBPACK_IMPORTED_MODULE_0__.DIDComm();
        this.postMessage({ type: "init", payload: {} });
        _logger__WEBPACK_IMPORTED_MODULE_1__["default"].log("Worker initialized.");
    }
    async establishMediation({ mediatorDid }) {
        _logger__WEBPACK_IMPORTED_MODULE_1__["default"].log("Establishing mediation with mediator: ", mediatorDid);
        this.didForMediator = await this.didcomm.generateDidForMediator();
        {
            const [msg, meta] = await this.didcomm.sendMessageAndExpectReply(mediatorDid, this.didForMediator, {
                type: "https://didcomm.org/coordinate-mediation/3.0/mediate-request"
            });
            const reply = msg.as_value();
            if (reply.type !== 'https://didcomm.org/coordinate-mediation/3.0/mediate-grant') {
                console.error("Unexpected reply: ", reply);
                throw new Error("Unexpected reply");
            }
            const routingDid = reply.body.routing_did[0];
            this.did = await this.didcomm.generateDid(routingDid);
            this.postMessage({ type: "didGenerated", payload: this.did });
        }
        const [msg, meta] = await this.didcomm.sendMessageAndExpectReply(mediatorDid, this.didForMediator, {
            type: "https://didcomm.org/coordinate-mediation/3.0/recipient-update",
            body: {
                updates: [
                    {
                        recipient_did: this.did,
                        action: "add",
                    }
                ]
            }
        });
        const reply = msg.as_value();
        if (reply.type !== 'https://didcomm.org/coordinate-mediation/3.0/recipient-update-response') {
            console.error("Unexpected reply: ", reply);
            throw new Error("Unexpected reply");
        }
        if (reply.body.updated[0]?.recipient_did !== this.did) {
            throw new Error("Unexpected did in recipient update response");
        }
        if (reply.body.updated[0]?.action !== "add") {
            throw new Error("Unexpected action in recipient update response");
        }
        if (reply.body.updated[0]?.result !== "success") {
            throw new Error("Unexpected status in recipient update response");
        }
    }
    async pickupStatus({ mediatorDid }) {
        const [msg, meta] = await this.didcomm.sendMessageAndExpectReply(mediatorDid, this.didForMediator, {
            type: "https://didcomm.org/messagepickup/3.0/status-request",
            body: {}
        });
        const status = msg.as_value();
        if (status.type !== "https://didcomm.org/messagepickup/3.0/status") {
            throw new Error("Unexpected reply: " + status.type);
        }
        await this.handleMessage(status);
    }
    async connect({ mediatorDid }) {
        _logger__WEBPACK_IMPORTED_MODULE_1__["default"].log("Connecting to mediator: ", mediatorDid);
        const endpoint = await this.didcomm.wsEndpoint(mediatorDid);
        _logger__WEBPACK_IMPORTED_MODULE_1__["default"].log("Discovered WS endpoint: ", endpoint.service_endpoint);
        this.ws = new WebSocket(endpoint.service_endpoint);
        this.ws.onmessage = async (event) => {
            await this.handlePackedMessage(await event.data.text());
        };
        this.ws.onopen = async (event) => {
            console.log("ws onopen", event);
            const [plaintext, live, meta] = await this.didcomm.prepareMessage(mediatorDid, this.didForMediator, {
                type: "https://didcomm.org/messagepickup/3.0/live-delivery-change",
                body: {
                    live_delivery: true
                }
            });
            this.ws.send(live);
            this.postMessage({ type: "connected", payload: {} });
        };
        this.ws.onerror = (event) => {
            console.log("ws onerror", event);
            this.postMessage({ type: "error", payload: {} });
        };
        this.ws.onclose = (event) => {
            console.log("ws onclose", event);
            this.postMessage({ type: "disconnected", payload: {} });
        };
    }
    async handlePackedMessage(packed) {
        const [msg, meta] = await this.didcomm.unpackMessage(packed);
        const message = msg.as_value();
        _logger__WEBPACK_IMPORTED_MODULE_1__["default"].recvMessage({ to: message.to[0], from: message.from, message: message });
        return await this.handleMessage(message);
    }
    async handleMessage(message) {
        console.log("handleMessage: ", message);
        switch (message.type) {
            case "https://didcomm.org/messagepickup/3.0/status":
                if (message.body.message_count > 0) {
                    const [msg, meta] = await this.didcomm.sendMessageAndExpectReply(message.from, this.didForMediator, {
                        type: "https://didcomm.org/messagepickup/3.0/delivery-request",
                        body: {
                            limit: message.body.message_count,
                        },
                    });
                    const delivery = msg.as_value();
                    if (delivery.type !== "https://didcomm.org/messagepickup/3.0/delivery") {
                        throw new Error("Unexpected reply: " + delivery.type);
                    }
                    await this.handleMessage(delivery);
                }
                break;
            case "https://didcomm.org/messagepickup/3.0/delivery":
                let received = [];
                message.attachments.forEach(async (attachement) => {
                    if ("base64" in attachement.data) {
                        received.push(attachement.id);
                        this.handlePackedMessage(atob(attachement.data.base64));
                    }
                    else if ("json" in attachement.data) {
                        received.push(attachement.id);
                        this.handlePackedMessage(JSON.stringify(attachement.data.json));
                    }
                    else {
                        console.error("Unhandled attachment: ", attachement);
                        throw new Error("Unhandled attachment");
                    }
                });
                const [msg, meta] = await this.didcomm.sendMessageAndExpectReply(message.from, this.didForMediator, {
                    type: "https://didcomm.org/messagepickup/3.0/messages-received",
                    body: {
                        message_id_list: received,
                    },
                });
                const status = msg.as_value();
                if (status.type !== "https://didcomm.org/messagepickup/3.0/status") {
                    throw new Error("Unexpected reply: " + status.type);
                }
                await this.handleMessage(status);
                break;
            default:
                console.log("Unhandled message: ", message);
                break;
        }
        this.postMessage({ type: "messageReceived", payload: message });
    }
    async disconnect() {
        this.ws.close();
        this.postMessage({ type: "disconnected", payload: {} });
    }
    async sendMessage({ to, message }) {
        await this.didcomm.sendMessage(to, this.did, message);
    }
    postMessage(message) {
        self.postMessage(message);
    }
    async route(event) {
        const { type, payload } = event.data;
        const method = this[type];
        if (typeof method === 'function') {
            const result = method.call(this, payload);
            if (result instanceof Promise) {
                await result;
            }
        }
        else {
            console.error("Unknown command type: ", type);
        }
    }
}
const handler = new DIDCommWorker();
console.log("Created worker: ", handler);
ctx.onmessage = async (event) => {
    console.log("Worker received message: ", event);
    await handler.route(event);
};
handler.init();

__webpack_async_result__();
} catch(e) { __webpack_async_result__(e); } });

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			id: moduleId,
/******/ 			loaded: false,
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/ 	
/******/ 	// the startup function
/******/ 	__webpack_require__.x = () => {
/******/ 		// Load entry module and return exports
/******/ 		// This entry module depends on other loaded chunks and execution need to be delayed
/******/ 		var __webpack_exports__ = __webpack_require__.O(undefined, ["vendors-node_modules_didcomm_index_js-node_modules_multibase_src_index_js-node_modules_multic-27f6b7"], () => (__webpack_require__("./src/lib/worker.ts")))
/******/ 		__webpack_exports__ = __webpack_require__.O(__webpack_exports__);
/******/ 		return __webpack_exports__;
/******/ 	};
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/async module */
/******/ 	(() => {
/******/ 		var webpackQueues = typeof Symbol === "function" ? Symbol("webpack queues") : "__webpack_queues__";
/******/ 		var webpackExports = typeof Symbol === "function" ? Symbol("webpack exports") : "__webpack_exports__";
/******/ 		var webpackError = typeof Symbol === "function" ? Symbol("webpack error") : "__webpack_error__";
/******/ 		var resolveQueue = (queue) => {
/******/ 			if(queue && queue.d < 1) {
/******/ 				queue.d = 1;
/******/ 				queue.forEach((fn) => (fn.r--));
/******/ 				queue.forEach((fn) => (fn.r-- ? fn.r++ : fn()));
/******/ 			}
/******/ 		}
/******/ 		var wrapDeps = (deps) => (deps.map((dep) => {
/******/ 			if(dep !== null && typeof dep === "object") {
/******/ 				if(dep[webpackQueues]) return dep;
/******/ 				if(dep.then) {
/******/ 					var queue = [];
/******/ 					queue.d = 0;
/******/ 					dep.then((r) => {
/******/ 						obj[webpackExports] = r;
/******/ 						resolveQueue(queue);
/******/ 					}, (e) => {
/******/ 						obj[webpackError] = e;
/******/ 						resolveQueue(queue);
/******/ 					});
/******/ 					var obj = {};
/******/ 					obj[webpackQueues] = (fn) => (fn(queue));
/******/ 					return obj;
/******/ 				}
/******/ 			}
/******/ 			var ret = {};
/******/ 			ret[webpackQueues] = x => {};
/******/ 			ret[webpackExports] = dep;
/******/ 			return ret;
/******/ 		}));
/******/ 		__webpack_require__.a = (module, body, hasAwait) => {
/******/ 			var queue;
/******/ 			hasAwait && ((queue = []).d = -1);
/******/ 			var depQueues = new Set();
/******/ 			var exports = module.exports;
/******/ 			var currentDeps;
/******/ 			var outerResolve;
/******/ 			var reject;
/******/ 			var promise = new Promise((resolve, rej) => {
/******/ 				reject = rej;
/******/ 				outerResolve = resolve;
/******/ 			});
/******/ 			promise[webpackExports] = exports;
/******/ 			promise[webpackQueues] = (fn) => (queue && fn(queue), depQueues.forEach(fn), promise["catch"](x => {}));
/******/ 			module.exports = promise;
/******/ 			body((deps) => {
/******/ 				currentDeps = wrapDeps(deps);
/******/ 				var fn;
/******/ 				var getResult = () => (currentDeps.map((d) => {
/******/ 					if(d[webpackError]) throw d[webpackError];
/******/ 					return d[webpackExports];
/******/ 				}))
/******/ 				var promise = new Promise((resolve) => {
/******/ 					fn = () => (resolve(getResult));
/******/ 					fn.r = 0;
/******/ 					var fnQueue = (q) => (q !== queue && !depQueues.has(q) && (depQueues.add(q), q && !q.d && (fn.r++, q.push(fn))));
/******/ 					currentDeps.map((dep) => (dep[webpackQueues](fnQueue)));
/******/ 				});
/******/ 				return fn.r ? promise : getResult();
/******/ 			}, (err) => ((err ? reject(promise[webpackError] = err) : outerResolve(exports)), resolveQueue(queue)));
/******/ 			queue && queue.d < 0 && (queue.d = 0);
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/chunk loaded */
/******/ 	(() => {
/******/ 		var deferred = [];
/******/ 		__webpack_require__.O = (result, chunkIds, fn, priority) => {
/******/ 			if(chunkIds) {
/******/ 				priority = priority || 0;
/******/ 				for(var i = deferred.length; i > 0 && deferred[i - 1][2] > priority; i--) deferred[i] = deferred[i - 1];
/******/ 				deferred[i] = [chunkIds, fn, priority];
/******/ 				return;
/******/ 			}
/******/ 			var notFulfilled = Infinity;
/******/ 			for (var i = 0; i < deferred.length; i++) {
/******/ 				var [chunkIds, fn, priority] = deferred[i];
/******/ 				var fulfilled = true;
/******/ 				for (var j = 0; j < chunkIds.length; j++) {
/******/ 					if ((priority & 1 === 0 || notFulfilled >= priority) && Object.keys(__webpack_require__.O).every((key) => (__webpack_require__.O[key](chunkIds[j])))) {
/******/ 						chunkIds.splice(j--, 1);
/******/ 					} else {
/******/ 						fulfilled = false;
/******/ 						if(priority < notFulfilled) notFulfilled = priority;
/******/ 					}
/******/ 				}
/******/ 				if(fulfilled) {
/******/ 					deferred.splice(i--, 1)
/******/ 					var r = fn();
/******/ 					if (r !== undefined) result = r;
/******/ 				}
/******/ 			}
/******/ 			return result;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__webpack_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__webpack_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
/******/ 				__webpack_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".bundle.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get mini-css chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks and sibling chunks for the entrypoint
/******/ 		__webpack_require__.miniCssF = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return undefined;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/harmony module decorator */
/******/ 	(() => {
/******/ 		__webpack_require__.hmd = (module) => {
/******/ 			module = Object.create(module);
/******/ 			if (!module.children) module.children = [];
/******/ 			Object.defineProperty(module, 'exports', {
/******/ 				enumerable: true,
/******/ 				set: () => {
/******/ 					throw new Error('ES Modules may not assign module.exports or exports.*, Use ESM export syntax, instead: ' + module.id);
/******/ 				}
/******/ 			});
/******/ 			return module;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/wasm loading */
/******/ 	(() => {
/******/ 		__webpack_require__.v = (exports, wasmModuleId, wasmModuleHash, importsObj) => {
/******/ 			var req = fetch(__webpack_require__.p + "" + wasmModuleHash + ".module.wasm");
/******/ 			if (typeof WebAssembly.instantiateStreaming === 'function') {
/******/ 				return WebAssembly.instantiateStreaming(req, importsObj)
/******/ 					.then((res) => (Object.assign(exports, res.instance.exports)));
/******/ 			}
/******/ 			return req
/******/ 				.then((x) => (x.arrayBuffer()))
/******/ 				.then((bytes) => (WebAssembly.instantiate(bytes, importsObj)))
/******/ 				.then((res) => (Object.assign(exports, res.instance.exports)));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript)
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && !scriptUrl) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/importScripts chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "already loaded"
/******/ 		var installedChunks = {
/******/ 			"src_lib_worker_ts": 1
/******/ 		};
/******/ 		
/******/ 		// importScripts chunk loading
/******/ 		var installChunk = (data) => {
/******/ 			var [chunkIds, moreModules, runtime] = data;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__webpack_require__.o(moreModules, moduleId)) {
/******/ 					__webpack_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__webpack_require__);
/******/ 			while(chunkIds.length)
/******/ 				installedChunks[chunkIds.pop()] = 1;
/******/ 			parentChunkLoadingFunction(data);
/******/ 		};
/******/ 		__webpack_require__.f.i = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					importScripts(__webpack_require__.p + __webpack_require__.u(chunkId));
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		var chunkLoadingGlobal = self["webpackChunkdidcomm_demo"] = self["webpackChunkdidcomm_demo"] || [];
/******/ 		var parentChunkLoadingFunction = chunkLoadingGlobal.push.bind(chunkLoadingGlobal);
/******/ 		chunkLoadingGlobal.push = installChunk;
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/startup chunk dependencies */
/******/ 	(() => {
/******/ 		var next = __webpack_require__.x;
/******/ 		__webpack_require__.x = () => {
/******/ 			return __webpack_require__.e("vendors-node_modules_didcomm_index_js-node_modules_multibase_src_index_js-node_modules_multic-27f6b7").then(next);
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// run startup
/******/ 	var __webpack_exports__ = __webpack_require__.x();
/******/ 	
/******/ })()
;
//# sourceMappingURL=src_lib_worker_ts.bundle.js.map