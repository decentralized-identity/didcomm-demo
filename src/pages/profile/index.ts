import * as m from "mithril"
import Navbar from "./navbar"
import ConsoleComponent from "./console"
import JSONEditor from "./jsoneditor"
import MessagingComponent from "./messaging"
import {Profile, generateProfile} from "../../lib/profile"
import agent from "../../lib/agent"

interface ProfileAttributes {
  actor?: string
}

export default class ProfilePage
  implements m.ClassComponent<ProfileAttributes>
{
  connected: boolean = true // initial state for the connection button
  profile: Profile
  worker: Worker

  oninit(vnode: m.Vnode<ProfileAttributes>) {
    const profile = generateProfile({ label: vnode.attrs.actor })
    m.route.set('/:actor', {actor: profile.label})
    agent.setupProfile(profile)
    agent.ondid = this.onDidGenerated.bind(this)
  }

  onDidGenerated(did: string) {
    agent.profile.did = did
    m.redraw()
  }

  view(vnode: m.Vnode<ProfileAttributes>) {
    return m(".container.is-fluid", [
      // Top Bar
      m(Navbar, {
        profileName: agent.profile.label,
        isConnected: this.connected,
        did: agent.profile.did,
        toggleConnection: () => (this.connected = !this.connected),
        onProfileNameChange: (newName: string) => {
          agent.profile.label = newName
          m.route.set('/:actor', {actor: agent.profile.label})
          m.redraw()
        },
      }),
      // Main Content
      m(".columns", [
        // Left Column
        m(".column", [
          m(MessagingComponent)
        ]),

        // Right Column
        m(".column.is-7", { style: "display: flex; flex-direction: column;" }, [
          m(
            "div",
            {
              style:
                "padding: 1rem; background-color: #f5f5f5; height: 60vh; overflow: hidden;",
            },
            m(ConsoleComponent, { stream: null })
          ),

          m(
            "div",
            {
              style:
                "margin-top: 1rem; padding: 1rem; background-color: #f5f5f5; flex-grow: 1; flex-shrink: 0; flex-basis: auto;",
            },
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
          ]),
        ]),
      ]),
    ])
  }
}
