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
    agent.onMessage("https://didcomm.org/basicmessage/2.0/message", this.onMessageReceived.bind(this))
  }

  onMessageReceived(message: AgentMessage) {
    console.log("FROSTYFROG");
    console.log(message);
    if (!ContactService.getContact(message.message.from)) {
      let newContact = {did: message.message.from};
      ContactService.addContact(newContact as Contact);
      this.contacts = ContactService.getContacts()
      m.redraw()
    }
  }

  onAddContact() {
    if (this.newContact.did) {
      ContactService.addContact(this.newContact as Contact)
      this.contacts = ContactService.getContacts()
      this.isModalOpen = false
    }
  }

  view(vnode: m.CVnode<ContactListComponentAttrs>) {
    return m(
      "div",
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
                key: contact.did,
                onclick: () => vnode.attrs.onSelect(contact),
              },
              [
                m("span.panel-icon", m("i.fas.fa-user")),
                m("span", contact.label || contact.did),
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
                  { onclick: () => this.onAddContact() },
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

  oninit(vnode: m.CVnode<MessageHistoryComponentAttrs>) {
    this.contact = vnode.attrs.contact
    this.messages = ContactService.getMessageHistory(vnode.attrs.contact.did)
    agent.onMessage("https://didcomm.org/basicmessage/2.0/message", this.onMessageReceived.bind(this))
  }

  onMessageReceived(message: AgentMessage) {
    if (message.sender.did === this.contact.did) {
      this.messages = ContactService.getMessageHistory(this.contact.did)
      m.redraw()
    }
  }

  async sendMessage(content: string) {
    await agent.sendMessage(this.contact, {
      type: "https://didcomm.org/basicmessage/2.0/message",
      lang: "en",
      body: {
        content
      }
    })
    const message = {
      sender: agent.profile.label,
      receiver: this.contact.label || this.contact.did,
      timestamp: new Date(),
      content: content,
    }
    ContactService.addMessage(this.contact.did, message)
    this.messages.push(message)
    m.redraw()
  }

  sendClicked() {
    this.sendMessage(this.content)
    this.content = ""
  }

  view(vnode: m.CVnode<MessageHistoryComponentAttrs>) {
    return m("div.messages", [
      m(
        "div",
        {
          style: "height: 100%;",
        },
        [
          m(
            "button.button.is-small.is-light",
            {
              onclick: vnode.attrs.onBack,
              style: "width: min-content;",
            },
            [
              m("span.icon", m("i.fas.fa-arrow-left")),
              m("span", "Back to Contacts"),
            ]
          ),
          m(
            "div",
            {
              style: {
                display: "flex",
                "flex-direction": "column",
                "justify-content": "flex-end",
                padding: "1rem",
                "max-height": "calc(100% - 2em)",
                height: "calc(100% - 2em)",
              },
            },
            m(
              "div",
              {
                style: {
                  display: "flex",
                  "flex-direction": "column",
                  "max-height": "100%",
                  "overflow-y": "auto",
                },
              },
              this.messages.map(message =>
                m(
                  ".box",
                  m(
                    ".media",
                    m(".media-content", [
                      m("p.title.is-5", message.sender),
                      m("p.subtitle.is-6", message.timestamp.toDateString()),
                      m("p", message.content),
                    ])
                  )
                )
              )
            )
          ),
        ]
      ),
      m("div", { style: "margin-top: 1rem;" }, [
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
