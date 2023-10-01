// ContactListComponent.ts
import * as m from "mithril"
import { default as ContactService, Contact, Message } from "../../lib/contacts"
import eventbus from "../../lib/eventbus"
import profile from "../../lib/profile"
import { IMessage } from "didcomm"
import agent, { AgentMessage } from "../../lib/agent"

import "./messaging.css"

interface ContactListComponentAttrs {
  onSelect: (contact: Contact) => void
}

class ContactListComponent
  implements m.ClassComponent<ContactListComponentAttrs>
{
  contacts: Contact[] = []
  isModalOpen: boolean = false
  newContact: Partial<Contact> = {}

  oninit() {
    this.contacts = ContactService.getContacts()
    agent.onAnyMessage(this.onMessageReceived.bind(this))
    agent.onMessage("https://didcomm.org/user-profile/1.0/profile", this.onProfileUpdate.bind(this))
    agent.onMessage("https://didcomm.org/user-profile/1.0/request-profile", this.onProfileRequest.bind(this))
  }

  async onProfileUpdate(message: AgentMessage) {
    let contact = ContactService.getContact(message.message.from);
    if(!contact)
      return;

    let label = message.message.body?.profile?.displayName;
    if(!label)
      return;

    contact.label = label;
    ContactService.addContact(contact);
  }

  async onProfileRequest(message: AgentMessage) {
    let contact = ContactService.getContact(message.message.from);
    if(!contact)
      return;
    await agent.sendProfile(contact)
  }

  async onMessageReceived(message: AgentMessage) {
    if(message.message.to[0]!=agent.profile.did)
      return;
    if (!ContactService.getContact(message.message.from)) {
      let newContact = {did: message.message.from};
      ContactService.addContact(newContact as Contact);
      if(message.message.type != "https://didcomm.org/user-profile/1.0/profile") {
        await agent.requestProfile(newContact)
      }
      this.contacts = ContactService.getContacts()
      m.redraw()
    }
  }

  async onAddContact() {
    if (this.newContact.did) {
      ContactService.addContact(this.newContact as Contact)
      this.contacts = ContactService.getContacts()
      this.isModalOpen = false
      agent.sendProfile(this.newContact as Contact)
      setTimeout(async () => {
        if(!this.newContact.label)
          await agent.requestProfile(this.newContact as Contact)
        agent.sendFeatureDiscovery(this.newContact as Contact)
      }, 500);
      //this.requestFeatures(this.newContact)
    }
  }

  view(vnode: m.CVnode<ContactListComponentAttrs>) {
    return m(
      "div",
      {
        style: {
          overflowY: "scroll",
          maxHeight: "100%",
        }
      },
      [
        // Contacts Panel
        m(
          ".panel",
          m(
            ".panel-heading",
            m("div.level", [
              m("div.level-left", m("p", "Contacts")),
              m(
                "div.level-right",
                m(
                  "button.button.is-small.is-primary.is-light",
                  { onclick: () => (this.isModalOpen = true) },
                  [m("span.icon", m("i.fas.fa-plus")), m("span", "New Contact")]
                )
              ),
            ])
          ),
          this.contacts.map(contact =>
            m(
              "a.panel-block",
              {
                style: {
                  position: "relative",
                },
                key: contact.did,
                onclick: () => vnode.attrs.onSelect(contact),
              },
              [
                m("span.panel-icon", m("i.fas.fa-user")),
                m("div", {
                  style: {
                    display: "inline-block",
                    position: "relative",
                    width: "100%",
                    marginTop: "-0.5em",
                    minHeight: "1em",
                  }
                },
                m("span",
                  {
                    style: {
                      width: "100%",
                      position: "absolute",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                    }
                  },
                  contact.label || contact.did
                 ),
                 ),
              ]
            )
          )
        ),
        // New Contact Modal
        this.isModalOpen &&
          m(".modal.is-active", [
            m(".modal-background", {
              onclick: () => (this.isModalOpen = false),
            }),
            m(".modal-card", [
              m("header.modal-card-head", [
                m("p.modal-card-title", "Add New Contact"),
                m("button.delete", {
                  "aria-label": "close",
                  onclick: () => (this.isModalOpen = false),
                }),
              ]),
              m("section.modal-card-body", [
                m(".field", [
                  m("label.label", "DID"),
                  m(
                    "div.control",
                    m(
                      'input.input[type=text][placeholder="DID of the contact"]',
                      {
                        oninput: (e: Event) =>
                          (this.newContact.did = (
                            e.target as HTMLInputElement
                          ).value),
                      }
                    )
                  ),
                ]),
                m(".field", [
                  m("label.label", "Label (optional)"),
                  m(
                    "div.control",
                    m(
                      'input.input[type=text][placeholder="Label for the contact"]',
                      {
                        oninput: (e: Event) =>
                          (this.newContact.label = (
                            e.target as HTMLInputElement
                          ).value),
                      }
                    )
                  ),
                ]),
              ]),
              m("footer.modal-card-foot", [
                m(
                  "button.button.is-success",
                  { onclick: async () => await this.onAddContact() },
                  "Save"
                ),
                m(
                  "button.button",
                  { onclick: () => (this.isModalOpen = false) },
                  "Cancel"
                ),
              ]),
            ]),
          ]),
      ]
    )
  }
}

interface MessageHistoryComponentAttrs {
  contact: Contact
  onBack: () => void
}

class MessageHistoryComponent
  implements m.ClassComponent<MessageHistoryComponentAttrs>
{
  messages: Message[] = []
  content: string = ""
  contact: Contact
  private editMode: boolean = false
  private editedContactLabel: string = ""
  private isModalOpen: boolean = false
  private rawMessageData: string = ""
  private autoScroll: boolean = true

  oninit(vnode: m.CVnode<MessageHistoryComponentAttrs>) {
    this.contact = vnode.attrs.contact
    this.messages = ContactService.getMessageHistory(vnode.attrs.contact.did)
    agent.onMessage("messageReceived", this.onMessageReceived.bind(this))
  }

  handleScroll(event: Event) {
    const container = event.target as HTMLElement

    // Check if we're close to the bottom
    const isAtBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 5
    this.autoScroll = isAtBottom
  }

  onupdate(vnode: m.VnodeDOM<MessageHistoryComponentAttrs>) {
    if (this.autoScroll) {
      const container = vnode.dom.querySelector("#message-box") as HTMLElement
      container.scrollTop = container.scrollHeight
    }
  }

  onMessageReceived(message: AgentMessage) {
    if (message?.sender?.did === this?.contact?.did) {
      this.messages = ContactService.getMessageHistory(this.contact.did)
      m.redraw()
    }
  }

  async sendMessage(content: string) {
    const message = {
      type: "https://didcomm.org/basicmessage/2.0/message",
      lang: "en",
      body: {
        content
      }
    };
    await agent.sendMessage(this.contact, message)
    m.redraw()
  }

  sendClicked() {
    this.sendMessage(this.content)
    this.content = ""
  }

  updateLabel(label: string) {
    this.contact.label = label
    ContactService.addContact(this.contact as Contact);
  }

  viewMessageBoxHeader(header: string, message: Message) {
    const isSelf = message.raw?.from == agent.profile.did
    const icon = isSelf ? "right-from-bracket" : "right-to-bracket"
    return m("div", {
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
      }
    }, [
      m("span", {style: {flexGrow: 1}}, `${header} - ${message.timestamp.toDateString()}`),
      m("span.icon", m(`i.fas.fa-${icon}`)),
    ])
  }

  viewBasicMessage(message: Message) {
    return m(
      ".box",
      m(
        ".media",
        m(".media-content", [
          m("p.title.is-5", {title: message.type}, message.sender),
          m("p.subtitle.is-6", message.timestamp.toDateString()),
          m("p", message.content),
        ])
      )
    )
  }

  viewProfileMessage(message: Message) {
    const isSelf = message.raw?.from == agent.profile.did
    return m(
      `.message.is-small.is-${isSelf ? "link" : "info"}`,
      [
        m(".message-header", [
          this.viewMessageBoxHeader("Profile Data", message),
        ]),
        m(".message-body", [
          m("p", [
            m("p", `New Display Name: ${message.raw.body?.profile?.displayName}`),
            m(
              "button.button.is-small.is-info.is-light",
              {
                onclick: () => {
                  this.isModalOpen = true
                  this.rawMessageData = JSON.stringify(message.raw, null, 2)
                }
              },
              [m("span.icon", m("i.fas.fa-plus")), m("span", "View Message")]
            ),
          ]),
        ])
      ])
  }

  viewProfileRequestMessage(message: Message) {
    const isSelf = message.raw?.from == agent.profile.did
    return m(
      `.message.is-small.is-${isSelf ? "link" : "info"}`,
      [
        m(".message-header", [
          this.viewMessageBoxHeader("Profile Request", message),
        ]),
        m(".message-body", [
          m("p", [
            m("p", message.raw.body?.profile?.displayName),
            m(
              "button.button.is-small.is-info.is-light",
              {
                onclick: () => {
                  this.isModalOpen = true
                  this.rawMessageData = JSON.stringify(message.raw, null, 2)
                }
              },
              [m("span.icon", m("i.fas.fa-plus")), m("span", "View Message")]
            ),
          ]),
        ])
      ])
  }

  viewUnknownMessage(message: Message) {
    return m(
      ".message.is-danger.is-small",
      [
        m(".message-header", [
          this.viewMessageBoxHeader("Unknown Message Type", message),
        ]),
        m(".message-body", [
          m("p.title.is-5", {title: message.type}, message.sender),
          m("p", [
            m("a", {href: message.type}, message.type),
            m(
              "button.button.is-small.is-info.is-light",
              {
                onclick: () => {
                  this.isModalOpen = true
                  this.rawMessageData = JSON.stringify(message.raw, null, 2)
                }
              },
              [m("span.icon", m("i.fas.fa-plus")), m("span", "View Message")]
            ),
          ]),
        ])
      ])
  }

  handleMessageView(message: Message) {
    switch(message.type) {
      case "https://didcomm.org/basicmessage/2.0/message":
        return this.viewBasicMessage(message);
      case "https://didcomm.org/user-profile/1.0/profile":
        return this.viewProfileMessage(message);
      case "https://didcomm.org/user-profile/1.0/request-profile":
        return this.viewProfileRequestMessage(message);
      default:
        return this.viewUnknownMessage(message);
    }
  }

  view(vnode: m.CVnode<MessageHistoryComponentAttrs>) {
    return m(".message-history", [
      m("span.navbar-item.messages-nav", [
        m(
          "button.button.is-small.is-light",
          {
            onclick: vnode.attrs.onBack,
          },
          [
            m("span.icon", m("i.fas.fa-arrow-left")),
            m("span", "Back to Contacts"),
          ]
        ),
        m("span.is-small", {style: {display: "flex", alignItems: "flex-end", flexGrow: "2", flexDirection: "column", position: "relative"}}, [
          this.editMode ? 
            m("span", {style: {display: "flex", alignItems: "center", position: "absolute", width: "100%"}}, [
            m("input", {
              value: this.editedContactLabel,
              oninput: (e: Event) => this.editedContactLabel = (e.target as HTMLInputElement).value,
                style: {
                border: "none",
                background: "transparent",
                outline: "none",
                paddingLeft: "12px",
                paddingRight: "12px",
                width: "100%",
                textAlign: "right",
                fontSize: "1em",
              },
              oncreate: (vnode: m.VnodeDOM) => {
                const input = vnode.dom as HTMLInputElement
                input.focus()
                input.setSelectionRange(this.editedContactLabel.length, this.editedContactLabel.length)
              },
              onkeydown: (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                  e.preventDefault()
                  this.editMode = false
                }
                if (e.key === 'Enter') {
                  e.preventDefault()
                  this.updateLabel(this.editedContactLabel)
                  this.editMode = false
                }
              }
            }),
            m("button.button.is-white.is-small", {
              onclick: () => {
                this.editMode = false
              },
              style: {marginRight: ".5em"}
            }, [
              m("span.icon", [m("i.fas.fa-cancel")])
            ]),
            m("button.button.is-white.is-small", {
              onclick: () => {
                this.updateLabel(this.editedContactLabel)
                this.editMode = false
              },
              style: {marginRight: ".5em"}
            }, [
              m("span.icon", [m("i.fas.fa-save")])
            ]),
          ]) : m("span", {style: {display: "flex", alignItems: "center", position: "absolute", width: "100%"}}, [
            m("span", {
              style: {
                marginBottom: "0",
                textAlign: "right",
                marginRight: ".5em",
                width: "100%",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                overflow: "hidden"
              }
            }, this.contact.label || this.contact.did),
            m("button.button.is-white.is-small", {
              onclick: () => {
                this.editMode = true
                this.editedContactLabel = this.contact.label
              },
              style: {marginRight: ".5em"}
            }, [
              m("span.icon", [m("i.fas.fa-edit")])
            ]),
          ]),
        ]),
      ]),
      m(
        ".messages",
        m(
          "div#message-box",
          {
            style: {
              display: "flex",
              "flex-direction": "column",
              "max-height": "100%",
              "overflow-y": "auto",
            },
            onscroll: (e: Event) => this.handleScroll(e),
          },
            this.messages.map((messages) => this.handleMessageView(messages))
        )
      ),
      // Unknown Message Dialog
      this.isModalOpen &&
        m(".modal.is-active", [
        m(".modal-background", {
          onclick: () => (this.isModalOpen = false),
        }),
          m(".modal-card", {
            style: {
              maxWidth: "calc(100vw - 40px)",
              width: "100%",
            }
          },
          [
            m("header.modal-card-head", [
              m("p.modal-card-title", "Raw DIDComm Message"),
              m("button.delete", {
                "aria-label": "close",
                onclick: () => (this.isModalOpen = false),
              }),
            ]),
            m("section.modal-card-body", [
              m(".field", [
                m(
                  "div.control",
                  m(
                    'textarea.textarea.is-normal[readonly]',
                    {
                      style: {
                        width: "100%",
                        height: "100%",
                      }
                    },
                    this.rawMessageData
                  )
                ),
              ]),
            ]),
            m("footer.modal-card-foot", {
              style: {
                flexDirection: "row-reverse"
              }
            },
            [
              m(
                "button.button",
                { onclick: () => (this.isModalOpen = false) },
                  "Exit"
              ),
            ]),
          ]),
      ]),
      m("div.message-controls", { style: "margin-top: 1rem;" }, [
        m("div.field.has-addons", [
          m(
            "div.control.is-expanded",
            m(
              "input.input[type=text][placeholder='Type your message...']",
              {
                value: this.content,
                oninput: (e: Event) => {
                  this.content = (e.target as HTMLInputElement).value
                },
                onkeypress: (e: KeyboardEvent) => {
                  if (e.key === "Enter") {
                    this.sendClicked()
                  }
                }
              }
            )
          ),
          m("div.control", m("button.button.is-info", {onclick: this.sendClicked.bind(this)}, "Send")),
        ]),
      ]),
    ])
  }
}

export default class MessagingComponent implements m.ClassComponent {
  currentContact: Contact | null = null

  view() {
    if (this.currentContact) {
      return m(MessageHistoryComponent, {
        contact: this.currentContact,
        onBack: () => (this.currentContact = null),
      })
    } else {
      return m(ContactListComponent, {
        onSelect: (contact: Contact) => (this.currentContact = contact),
      })
    }
  }
}
