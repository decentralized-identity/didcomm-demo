# DIDComm Browser Demo

The [DIDComm Browser Demo][demo] contains a fully functioning DIDComm v2
application, capable of both sending and receiving DIDComm messages through a
DIDComm v2 capable mediator. The purpose of the [DIDComm Demo][demo] is to help
people understand the basics of [DID Communication][didcomm] without burdening
them with all the complexities of optional protocols, such as those pertaining
to verifiable credentials. With this in mind, only the following DIDComm
protocols have been implemented:

Protocols pertaining to mediation:
- https://didcomm.org/coordinate-mediation/3.0/
- https://didcomm.org/messagepickup/3.0/

Core Protocols:
- https://didcomm.org/routing/2.0/ (via the [didcomm][didcommts] typescript library)
- https://didcomm.org/discover-features/2.0/
- https://didcomm.org/trust-ping/2.0/

Protocols implemented to make the demo be easier to use:
- https://didcomm.org/basicmessage/2.0/
- https://didcomm.org/user-profile/1.0/

Along with the above protocols, `only did:peer:2` DIDs are supported at this
time. The [DIDComm Demo][demo] creates a new `did:peer:2` DID upon page load
and connects to a mediator (via the mediator's `did:peer:2` DID) to negotiate
mediation. Once the negotiation has completed, the demo's DID will appear at
the top of the screen.

[demo]: https://demo.didcomm.org
[didcomm]: https://didcomm.org
[didcommts]: https://www.npmjs.com/package/didcomm
