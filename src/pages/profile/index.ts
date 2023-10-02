import * as m from "mithril"
import Navbar from "./navbar"
import { default as ContactService, Contact } from "../../lib/contacts"
import ConsoleComponent from "./console"
import ComposeComponent from "./compose"
import MessagingComponent from "./messaging"
import { IMessage } from "didcomm"
import { Profile, generateProfile } from "../../lib/profile"
import agent from "../../lib/agent"

import "./index.css"

interface ProfileAttributes {
  actor?: string
}

export default class ProfilePage
  implements m.ClassComponent<ProfileAttributes>
{
  connected: boolean = false // initial state for the connection button
  profile: Profile
  worker: Worker

  oninit(vnode: m.Vnode<ProfileAttributes>) {
    const profile = generateProfile({ label: vnode.attrs.actor })
    m.route.set("/:actor", { actor: profile.label })
    agent.setupProfile(profile)
    agent.ondid = this.onDidGenerated.bind(this)
    agent.onconnect = () => {
      this.connected = true
      m.redraw()
    }
    agent.ondisconnect = () => {
      this.connected = false
      m.redraw()
    }
  }

  onDidGenerated(did: string) {
    agent.profile.did = did
    m.redraw()
  }

  async sendMessage(contact: Contact, message: IMessage) {
    const internalMessage = {
      sender: agent.profile.label,
      receiver: contact.label || contact.did,
      timestamp: new Date(),
      type: message.type,
      content: "",
      raw: message,
    }
    await agent.sendMessage(contact, message)
    internalMessage.raw.from = agent.profile.did
    ContactService.addMessage(contact.did, internalMessage)
  }

  async toggleConnection() {
    if (this.connected) {
      await agent.disconnect()
    } else {
      await agent.connect()
    }
  }

  view(vnode: m.Vnode<ProfileAttributes>) {
    return m(".container.is-fluid", [
      // Top Bar
      m(Navbar, {
        profileName: agent.profile.label,
        isConnected: this.connected,
        did: agent.profile.did,
        toggleConnection: this.toggleConnection.bind(this),
        onProfileNameChange: async (newName: string) => {
          agent.profile.label = newName
          m.route.set("/:actor", { actor: agent.profile.label })
          let contacts = ContactService.getContacts()
          for (let contact of contacts) {
            await agent.sendProfile(contact)
          }
          m.redraw()
        },
      }),
      // Main Content
      m(".columns", [
        // Left Column
        m("#left.column.component-group", [m(MessagingComponent)]),
        // Right Column
        m(
          "#right.column.is-7.component-group",
          { style: "display: flex; flex-direction: column;" },
          [
            m(".console-container", m(ConsoleComponent, { stream: null })),
            m(".compose-container", m(ComposeComponent)),
          ]
        ),
      ]),
    ])
  }
}
