// ContactListComponent.ts
import * as m from "mithril"
import { default as ContactService, Contact, Message } from "../../lib/contacts"
import MessageCard from "./message"
import agent, { AgentMessage } from "../../lib/agent"

import "./messaging.css"
import eventbus, { ScopedEventBus } from "../../lib/eventbus"

interface ContactListComponentAttrs {
  onSelect: (contact: Contact) => void
}

class ContactListComponent
  implements m.ClassComponent<ContactListComponentAttrs>
{
  private contacts: Contact[] = []
  private isModalOpen: boolean = false
  private newContact: Partial<Contact> = {}
  private eventbus: ScopedEventBus

  oninit() {
    this.contacts = ContactService.getContacts()
    this.eventbus = eventbus.scoped()
    this.eventbus.collect(agent.onAnyMessage(this.onMessageReceived.bind(this)))
  }

  onremove() {
    this.eventbus.close()
  }

  async onMessageReceived(message: AgentMessage) {
    if (message.message.to[0] != agent.profile.did) return
    if (!ContactService.getContact(message.message.from)) {
      let newContact = { did: message.message.from }
      ContactService.addContact(newContact as Contact)
      let msgToSave = {
        raw: message.message,
        type: message.message.type,
        sender: newContact.did,
        receiver: message.receiver?.label || message.receiver.did,
        timestamp: new Date(),
        content: message.message.body?.content
      };
      ContactService.addMessage(newContact.did, msgToSave)
      if (
        message.message.type != "https://didcomm.org/user-profile/1.0/profile"
      ) {
        await agent.requestProfile(newContact)
      }
      this.contacts = ContactService.getContacts()
      m.redraw()
    }
  }

  async onAddContact() {
    if (this.newContact.did) {
      if (!ContactService.getContact(this.newContact.did))
        ContactService.addContact(this.newContact as Contact)
      this.contacts = ContactService.getContacts()
      this.isModalOpen = false
      agent.sendProfile(this.newContact as Contact)
      setTimeout(async () => {
        if (!this.newContact.label)
          await agent.requestProfile(this.newContact as Contact)
        agent.sendFeatureDiscovery(this.newContact as Contact)
      }, 500)
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
        },
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
                m(
                  "div",
                  {
                    style: {
                      display: "inline-block",
                      position: "relative",
                      width: "100%",
                      marginTop: "-0.5em",
                      minHeight: "1em",
                    },
                  },
                  m(
                    "span",
                    {
                      style: {
                        width: "100%",
                        position: "absolute",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                      },
                    },
                    contact.label || contact.did
                  )
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
  private didCopied: boolean = false
  private editMode: boolean = false
  private contactHover: boolean = false
  private editedContactLabel: string = ""
  private autoScroll: boolean = true
  private eventbus: ScopedEventBus

  oninit(vnode: m.CVnode<MessageHistoryComponentAttrs>) {
    this.contact = vnode.attrs.contact
    ContactService.selectContact(this.contact)
    this.messages = ContactService.getMessageHistory(vnode.attrs.contact.did)
    this.eventbus = eventbus.scoped()
    this.eventbus.collect(agent.onAnyMessage(this.onMessageReceived.bind(this)))
  }

  onremove() {
    this.eventbus.close()
  }

  handleScroll(event: Event) {
    const container = event.target as HTMLElement

    // Check if we're close to the bottom
    const isAtBottom =
      container.scrollHeight - container.scrollTop <= container.clientHeight + 5
    this.autoScroll = isAtBottom
  }

  scrollToBottom(vnode: m.VnodeDOM<MessageHistoryComponentAttrs>) {
    const container = vnode.dom.querySelector("#message-box") as HTMLElement
    container.scrollTop = container.scrollHeight
  }

  oncreate(vnode: m.VnodeDOM<MessageHistoryComponentAttrs>) {
    this.scrollToBottom(vnode)
  }

  onupdate(vnode: m.VnodeDOM<MessageHistoryComponentAttrs>) {
    if (this.autoScroll) this.scrollToBottom(vnode)
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
        content,
      },
    }
    await agent.sendMessage(this.contact, message)
    m.redraw()
  }

  sendClicked() {
    this.sendMessage(this.content)
    this.content = ""
  }

  updateLabel(label: string) {
    this.contact.label = label
    ContactService.addContact(this.contact as Contact)
  }

  private showToast(message: string, duration: number = 2000) {
    // Create a div element for the toast
    const toast = document.createElement("div")
    toast.className = "toast"
    toast.textContent = message

    // Append it to the body
    document.body.appendChild(toast)

    // Force a reflow to trigger the transition
    void toast.offsetWidth

    // Show the toast
    toast.classList.add("show")

    // Remove the toast after the specified duration
    setTimeout(() => {
      toast.classList.remove("show")

      // Wait for the transition to finish before removing the element
      toast.addEventListener("transitionend", () => {
        document.body.removeChild(toast)
      })
    }, duration)
  }

  private copyToClipboard(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.didCopied = true
        m.redraw() // Inform Mithril to redraw the component

        // Reset after some time (e.g., 2 seconds)
        setTimeout(() => {
          this.didCopied = false
          m.redraw()
        }, 2000)

        // Show the toast
        // Assuming you have a toast library/method named `showToast`
        this.showToast("Copied!")
      })
      .catch(err => {
        console.error("Failed to copy text: ", err)
      })
  }

  private messageTypeToProtocol(messageType: string) {
    return messageType.slice(0, messageType.lastIndexOf("/"))
  }

  viewMessage(message: Message) {
    switch (message.type) {
      case "https://didcomm.org/basicmessage/2.0/message":
        return m(
          MessageCard,
          {
            header: message.sender,
            message,
          },
          [m("p", message.content)]
        )
      case "https://didcomm.org/user-profile/1.0/profile":
        return m(
          MessageCard,
          { header: "Profile Data", message, class: "info", inspectable: true },
          [
            m(
              "p",
              `New Display Name: ${message.raw.body?.profile?.displayName}`
            ),
          ]
        )
      case "https://didcomm.org/user-profile/1.0/request-profile":
        return m(
          MessageCard,
          {
            header: "Profile Request",
            message,
            class: "info",
            inspectable: true,
          },
          [
            m(
              "p",
              `Requested attributes: ${message.raw.body?.query?.join(", ")}`
            ),
          ]
        )
      case "https://didcomm.org/discover-features/2.0/queries":
        return m(
          MessageCard,
          {
            header: "Feature Query",
            message,
            class: "info",
            inspectable: true,
          },
          message.raw.body.queries.map((query: any) =>
            m(
              "p",
              `Requesting features of type "${query["feature-type"]}" matching "${query.match}"`
            )
          )
        )
      case "https://didcomm.org/discover-features/2.0/disclose":
        return m(
          MessageCard,
          {
            header: "Feature Disclosure",
            message,
            class: "info",
            inspectable: true,
          },
          m(
            "ul.disclose-list",
            message.raw.body.disclosures.map((disclosure: any) =>
              m(
                "li",
                m("span", [
                  `${disclosure["feature-type"]}: `,
                  m(
                    "a",
                    {
                      href: disclosure.id,
                      target: "_blank",
                    },
                    [
                      disclosure.id,
                      m(
                        "span.icon",
                        m(`i.fas.fa-arrow-up-right-from-square.is-small`)
                      ),
                    ]
                  ),
                ])
              )
            )
          )
        )
      case "https://didcomm.org/trust-ping/2.0/ping":
        return m(MessageCard, {
          header: "Ping",
          message,
          inspectable: false,
          hideBody: true,
        })
      case "https://didcomm.org/trust-ping/2.0/ping-response":
        return m(MessageCard, {
          header: "Pong",
          message,
          inspectable: false,
          hideBody: true,
        })
      case "https://didcomm.org/empty/1.0/empty":
        return m(MessageCard, {
          header: "Empty",
          message,
          inspectable: false,
          hideBody: true,
        })
      default:
        return m(
          MessageCard,
          {
            header: "Unknown Message Type",
            message,
            class: "unhandled",
            inspectable: true,
          },
          m("a", { href: this.messageTypeToProtocol(message.type), target: "_blank" }, [
            message.type,
            m("span.icon", m(`i.fas.fa-arrow-up-right-from-square.is-small`)),
          ])
        )
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
        m(
          "span.is-small",
          {
            style: {
              display: "flex",
              alignItems: "flex-end",
              flexGrow: "2",
              flexDirection: "column",
              alignSelf: "flex-start",
              position: "relative",
            },
          },
          [
            this.editMode
              ? m(
                  "span",
                  { style: { display: "flex", alignItems: "center" } },
                  [
                    m("input", {
                      value: this.editedContactLabel,
                      oninput: (e: Event) =>
                        (this.editedContactLabel = (
                          e.target as HTMLInputElement
                        ).value),
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
                        input.setSelectionRange(
                          this.editedContactLabel.length,
                          this.editedContactLabel.length
                        )
                      },
                      onkeydown: (e: KeyboardEvent) => {
                        if (e.key === "Escape") {
                          e.preventDefault()
                          this.editMode = false
                        }
                        if (e.key === "Enter") {
                          e.preventDefault()
                          this.updateLabel(this.editedContactLabel)
                          this.editMode = false
                        }
                      },
                    }),
                    m(
                      "button.button.is-white.is-small",
                      {
                        onclick: () => {
                          this.editMode = false
                        },
                        style: { marginRight: ".5em" },
                      },
                      [m("span.icon", [m("i.fas.fa-cancel")])]
                    ),
                    m(
                      "button.button.is-white.is-small",
                      {
                        onclick: () => {
                          this.updateLabel(this.editedContactLabel)
                          this.editMode = false
                        },
                        style: { marginRight: ".5em" },
                      },
                      [m("span.icon", [m("i.fas.fa-save")])]
                    ),
                  ]
                )
              : m(
                  "span",
                  {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      position: "absolute",
                      width: "100%",
                    },
                  },
                  [
                    m(
                      "span",
                      {
                        style: {
                          marginBottom: "0",
                          textAlign: "right",
                          marginRight: ".5em",
                          width: "100%",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                        },
                        onmouseover: () => {
                          this.contactHover = true
                        },
                        onmouseout: () => {
                          this.contactHover = false
                        },
                        onclick: () => {
                          this.copyToClipboard(this.contact.did)
                        },
                      },
                      this.contactHover
                        ? this.contact.did
                        : this.contact.label || this.contact.did
                    ),
                    m(
                      "button.button.is-white.is-small",
                      {
                        onclick: () => {
                          this.editMode = true
                          this.editedContactLabel = this.contact.label
                        },
                        style: { marginRight: ".5em" },
                      },
                      [m("span.icon", [m("i.fas.fa-edit")])]
                    ),
                  ]
                ),
          ]
        ),
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
          this.messages.map(message => this.viewMessage(message))
        )
      ),
      m("div.message-controls", { style: "margin-top: 1rem;" }, [
        m("div.field.has-addons", [
          m(
            "div.control.is-expanded",
            m("input.input[type=text][placeholder='Type your message...']", {
              value: this.content,
              oninput: (e: Event) => {
                this.content = (e.target as HTMLInputElement).value
              },
              onkeypress: (e: KeyboardEvent) => {
                if (e.key === "Enter") {
                  this.sendClicked()
                }
              },
            })
          ),
          m(
            "div.control",
            m(
              "button.button.is-info",
              { onclick: this.sendClicked.bind(this) },
              "Send"
            )
          ),
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

// vim: set ts=2 sw=2 sts=2 et ai :
