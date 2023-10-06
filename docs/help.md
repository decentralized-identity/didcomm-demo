# How to use this demo

These basic instructions will help you understand how to use this demo to understand DIDComm and demonstate some of it's basic capabilities.

1. Open one or more browser tabs to this page (https://demo.didcomm.org)
    - You'll need at least two open somewhere to demonstrate message sending and receiving. These can be on the same computer, different computers on the same network, or different computers anywhere on the internet. 
2.  A name will be autoselected for you, shown in the upper left corner. You may rename it by clicking the edit button, changing the name, and pressing the Enter/Return key when done.
3.  A DID was created for you, shown next to your name. click the copy icon to copy it to your clipboard, for use or sharing with other demo participants. 
4. Share that DID with other demo participants to add as a contact. If using two tabs on the same computer, switch to the other tab.
5. Add a new contact by clicking the `New Contact` button, pasting in the DID copied in step 3, and clicking `Save`.
    - Contacts only need to be added one direction. The other party will have a contact created for them automatically.
6. View the contact by clicking the newly created item under `contacts`.
    - If you shared the DID with multiple other parties and they added a contact, you will see multiple entries identified by the name shown on their demo.
7. You may now engage in any of the demo activities described below, in any order.
8. Click `Back to Contacts` to return to the contact list.
9. Reloading the page will generate a new DID and clear your contacts list.

## See Discover Features Message

In the left hand side, you'll see nicely rendered items showing messages back and forth between you and this contact. The initial messages are automatically sent when a contact is added. New messages you send and receive will appear below.

## Send BasicMessage Messages

The box in the lower-left corner will allow you to type and send BasicMessage messages, showing the basics of human communication oriented protocols.

## Review Message Log

The right hand side contains the list of log entries and unencrypted copies of the messages sent and received. This allows you to view the message format itself and understand the information flowing between the connected parties.

This list shows all messages from all connections. Future improvements to the demo will allow more selective filtering of this raw message list.

Some of these messages will be messages to and from the connected mediator, used to securely relay messages around firewalls and other connectivity challenges.

## Craft and send any DIDComm Message

On the lower right, there is a box that you can use to craft and send any DIDComm message to the other party. There is a drop-down list of presets to get you started, including the Trust Ping protocol.

## See message documentation for unknown types

When a message arrives with a message type the demo doesn't recognize, it'll display a box with message details and a link to the protocol documentation.

## Explore Demo Code

Visit the [Github Repo](https://github.com/decentralized-identity/didcomm-demo) for this demo, and browse the code that makes it work!