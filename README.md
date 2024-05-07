# DIDComm Browser Demo

## Overview

The [DIDComm Browser Demo](https://demo.didcomm.org) showcases a fully functioning DIDComm v2 application capable of both sending and receiving messages through a DIDComm v2 capable mediator. The primary goal of the demo is to simplify the understanding of [DID Communication](https://didcomm.org) (DIDComm) principles by implementing only essential protocols.

### Supported Protocols

**Mediation Protocols:**

- [Coordinate Mediation 3.0](https://didcomm.org/coordinate-mediation/3.0/)
- [Message Pickup 3.0](https://didcomm.org/messagepickup/3.0/)

**Core Protocols:**

- [Routing 2.0](https://didcomm.org/routing/2.0/) (via the [didcomm TypeScript library](https://www.npmjs.com/package/didcomm))
- [Discover Features 2.0](https://didcomm.org/discover-features/2.0/)
- [Trust Ping 2.0](https://didcomm.org/trust-ping/2.0/)

**Utility Protocols for Enhanced Usability:**

- [Basic Message 2.0](https://didcomm.org/basicmessage/2.0/)
- [User Profile 1.0](https://didcomm.org/user-profile/1.0/)

**DID Support:**
Currently, only `did:peer:2` DIDs are supported. Upon page load, a new `did:peer:2` DID is generated, which connects to a mediator to negotiate mediation.

## Getting Started

### Prerequisites

Before you can run or build the DIDComm Browser Demo, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js) or [Yarn](https://yarnpkg.com/)

### Installation

Clone the repository and install the dependencies:

`git clone https://github.com/decentralized-identity/didcomm-demo.git`
`cd didcomm-demo`
`npm install`  # Or use `yarn install` if you prefer yarn over npm

### Running the Application

To run the application locally:

`npm start`  # Or `yarn start`

This command starts a local development server. Open http://localhost:8080 in your browser to view the application.

### Building the Application

To build the application for production:

`npm run build`  # Or `yarn build`

This will bundle the application into static files in the `dist/` directory.

### Formatting Code

To format the TypeScript files in the `src/` directory:

`npm run format`  # Or `yarn format`

## Contributing

Contributions to the DIDComm Browser Demo are welcome! Here are a few ways you can help:

- Report issues and suggest features in the [Issues](https://github.com/decentralized-identity/didcomm-demo/issues) section of the repository.
- Submit pull requests with bug fixes and new features.

Please read [CONTRIBUTING.md](https://github.com/decentralized-identity/didcomm-demo/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the ISC License - see the [LICENSE](https://github.com/decentralized-identity/didcomm-demo/blob/main/LICENSE) file for details.
