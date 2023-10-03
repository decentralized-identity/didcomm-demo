import * as m from "mithril"
import { Message } from "../../lib/contacts"
import agent from "../../lib/agent"

interface MessageCardAttrs {
  header: string
  message: Message
  class?: "unhandled" | "info"
  inspectable?: boolean
}

export default class MessageCard implements m.ClassComponent<MessageCardAttrs> {
  header: string
  message: Message
  class?: "unhandled" | "info"
  status: "sent" | "received"
  inspectable?: boolean
  private isModalOpen: boolean = false
  private rawMessageData: string = ""

  oninit(vnode: m.Vnode<MessageCardAttrs>) {
    this.header = vnode.attrs.header
    this.message = vnode.attrs.message
    this.class = vnode.attrs.class
    this.inspectable = vnode.attrs.inspectable

    this.status =
      this.message.raw?.from == agent.profile.did ? "sent" : "received"
  }
  viewMessageBoxHeader(header: string, message: Message) {
    const icon = this.status == "sent" ? "arrow-right" : "arrow-left"
    return m(
      "div",
      {
        style: {
          width: "100%",
          display: "flex",
          alignItems: "center",
        },
      },
      [
        m(
          "span",
          { style: { flexGrow: 1 } },
          `${header} - ${message.timestamp.toLocaleTimeString()}`
        ),
        m("span.icon", m(`i.fas.fa-${icon}`)),
      ]
    )
  }

  private get messageClass() {
    if (this.class) {
      if (this.class == "unhandled") {
        return "is-danger"
      } else if (this.class == "info") {
        return ""
      }
    }
    if (this.status == "sent") {
      return "sent"
    } else {
      return "received"
    }
  }

  view(vnode: m.Vnode<MessageCardAttrs>) {
    return m(`.message.${this.messageClass}`, [
      m(".message-header", [
        this.viewMessageBoxHeader(this.header, this.message),
      ]),
      m(
        ".message-body",
        {
          style: {
            display: "flex",
            flexDirection: "column",
          },
        },
        [
          m("div", [
            vnode.children,
            this.inspectable &&
              m(
                "button.button.is-small",
                {
                  onclick: () => {
                    this.isModalOpen = true
                    this.rawMessageData = JSON.stringify(
                      this.message.raw,
                      null,
                      2
                    )
                  },
                  style: {
                    marginTop: ".75rem",
                    float: "right",
                  },
                },
                [m("span.icon", m("i.fas.fa-plus")), m("span", "View Message")]
              ),
          ]),
        ]
      ),
      this.isModalOpen &&
        m(".modal.is-active", [
          m(".modal-background", {
            onclick: () => (this.isModalOpen = false),
          }),
          m(
            ".modal-card",
            {
              style: {
                maxWidth: "calc(100vw - 40px)",
                width: "100%",
              },
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
                      "textarea.textarea.is-normal[readonly]",
                      {
                        style: {
                          width: "100%",
                          height: "100%",
                        },
                      },
                      this.rawMessageData
                    )
                  ),
                ]),
              ]),
              m(
                "footer.modal-card-foot",
                {
                  style: {
                    flexDirection: "row-reverse",
                  },
                },
                [
                  m(
                    "button.button",
                    { onclick: () => (this.isModalOpen = false) },
                    "Exit"
                  ),
                ]
              ),
            ]
          ),
        ]),
    ])
  }
}
