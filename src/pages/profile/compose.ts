import * as m from "mithril"
import JSONEditor from "./jsoneditor"
import agent from "../../lib/agent"

import "./compose.css"
import contacts from "../../lib/contacts"

const SAMPLES: Record<string, any> = {
  "Trust Ping": {
    type: "https://didcomm.org/trust-ping/2.0/ping",
    body: {
      response_requested: true,
    },
  },
  None: {},
}

export default class ComposeComponent implements m.ClassComponent {
  content: string = ""

  onSendClicked() {
    const editor = document.querySelector("lit-code") as any
    const content = JSON.parse(editor.getCode())
    agent.sendMessage(contacts.selectedContact, content)
  }

  oncreate(vnode: m.VnodeDOM<{}, this>) {
    this.content = JSON.stringify(SAMPLES["Trust Ping"], null, 2)
  }

  onSampleSelected(e: Event) {
    this.content = JSON.stringify(
      SAMPLES[(e.target as HTMLSelectElement).value],
      null,
      2
    )
    m.redraw()
  }

  view() {
    return m("div.compose", [
      m("div.editor-container", m(JSONEditor, { content: this.content })),

      m("div", { style: "margin-top: 1rem;" }, [
        m("div.field.has-addons", [
          m(
            "div.control is-expanded",
            m(
              "div.select is-fullwidth",
              m(
                "select",
                {
                  style: "width: 100%",
                  onchange: this.onSampleSelected.bind(this),
                },
                Object.keys(SAMPLES).map(name =>
                  m(
                    "option",
                    {
                      value: name,
                    },
                    name
                  )
                )
              )
            )
          ),
          m(
            "div.control",
            m(
              "button.button.is-info",
              {
                onclick: this.onSendClicked.bind(this),
                disabled: !contacts.selectedContact,
              },
              "Send"
            )
          ),
        ]),
      ]),
    ])
  }
}
