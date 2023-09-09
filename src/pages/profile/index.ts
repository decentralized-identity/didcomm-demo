import * as m from "mithril";
import { Secret } from "../../lib/profile";
import Navbar from "./navbar";

interface ProfileAttributes {
  id: string;
}

export default class ProfilePage implements m.ClassComponent<ProfileAttributes> {
  id: string;
  connected: boolean = true; // initial state for the connection button

  view(vnode: m.Vnode<ProfileAttributes>) {
    return m(".container.is-fluid", [
      // Top Bar
      m(Navbar, {
        profileName: vnode.attrs.id,
        isConnected: this.connected,
        toggleConnection: () => this.connected = !this.connected
      }),

      // Main Content
      m(".columns", [
        // Left Column
        m(".column.is-7", [
          m(".box", { style: "height: 60%;" }, "Console Placeholder"),
          m(".box", { style: "height: 30%;" }, "JSON Editor Placeholder"),
          m("div.field.has-addons", [
            m("div.control", m("div.select", m("select", "Saved Entry 1"))),
            m("div.control", m("button.button", "Save")),
            m("div.control", m("button.button", "Send"))
          ])
        ]),

        // Right Column
        m(".column", [
          m(".box", { style: "height: 85%;" }, [
            // Message bubbles as placeholders
            m(".content", "Received Message Content"),
            m(".content.has-text-right", "Sent Message Content"),
          ]),
          m("div.field.has-addons", [
            m("div.control.is-expanded", m("input.input[type=text][placeholder='Type your message...']")),
            m("div.control", m("button.button.is-info", "Send"))
          ])
        ])
      ])
    ]);
  }
}
