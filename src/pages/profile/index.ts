import * as m from "mithril";
import { Secret } from "../../lib/profile";
import Navbar from "./navbar";
import ConsoleComponent from "./console";
import JSONEditor from "./jsoneditor";
import MessagingComponent from "./messaging";

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
        m(".column.is-7", { style: "display: flex; flex-direction: column;" }, [
          m("div", { 
            style: "padding: 1rem; background-color: #f5f5f5; height: 60vh; overflow: hidden;" 
          }, m(ConsoleComponent, {stream: null})),

          m("div", { 
            style: "margin-top: 1rem; padding: 1rem; background-color: #f5f5f5; flex-grow: 1; flex-shrink: 0; flex-basis: auto;" 
          }, m(JSONEditor)),

          m("div", { style: "margin-top: 1rem;" }, [
            m("div.field.has-addons", [
              m("div.control is-expanded", m("div.select is-fullwidth", m("select", {style: "width: 100%"}, "Saved Entry 1"))),
              m("div.control", m("button.button", "Save")),
              m("div.control", m("button.button", "Send"))
            ])
          ])
        ]),

        // Right Column
        m(".column", [
          m("div", { 
            style: "display: flex; flex-direction: column; justify-content: flex-end; padding: 1rem; background-color: #f5f5f5; height: 75vh;" 
          }, m(MessagingComponent)),
          m("div", { style: "margin-top: 1rem;" }, [
            m("div.field.has-addons", [
              m("div.control.is-expanded", m("input.input[type=text][placeholder='Type your message...']")),
              m("div.control", m("button.button.is-info", "Send"))
            ])
          ])
        ])
      ])
    ]);
  }
}
