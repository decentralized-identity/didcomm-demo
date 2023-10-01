import * as m from "mithril"
import JSONEditor from "./jsoneditor"

import "./compose.css"

export default class ComposeComponent implements m.ClassComponent {

  view() {
    return m("div.compose", [
      m(
        "div.editor-container",
        m(JSONEditor)
      ),

      m("div", { style: "margin-top: 1rem;" }, [
        m("div.field.has-addons", [
          m(
            "div.control is-expanded",
            m(
              "div.select is-fullwidth",
              m("select", { style: "width: 100%" }, "Saved Entry 1")
            )
          ),
          m("div.control", m("button.button", "Save")),
          m("div.control", m("button.button", "Send")),
        ]),
      ])
    ]) 
  }
}
