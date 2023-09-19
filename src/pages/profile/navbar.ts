import * as m from "mithril"
import Icon from "../../components/icon"

import { library } from "@fortawesome/fontawesome-svg-core"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { faCircle } from "@fortawesome/free-solid-svg-icons"
import { faEdit } from "@fortawesome/free-solid-svg-icons"

library.add(faArrowLeft, faCircle, faEdit)

interface NavbarAttributes {
  profileName: string
  isConnected: boolean
  toggleConnection: () => void
  onProfileNameChange: (newName: string) => void
}

export default class Navbar implements m.ClassComponent<NavbarAttributes> {
  private burgerActive: boolean = false
  private editMode: boolean = false
  private editedProfileName: string = ""

  view(vnode: m.Vnode<NavbarAttributes>) {
    const { profileName, isConnected, toggleConnection, onProfileNameChange } = vnode.attrs

    return m("nav.navbar", [
      m(".navbar-brand", { style: {display: "flex", alignItems: "center"} }, [
      this.editMode ? m("input.title", {
        value: this.editedProfileName,
        oninput: (e: Event) => this.editedProfileName = (e.target as HTMLInputElement).value,
        onblur: () => {
          onProfileNameChange(this.editedProfileName)
          this.editMode = false
        },
        style: {
          border: "none",
          background: "transparent",
          outline: "none",
          paddingLeft: "12px",
        },
        oncreate: (vnode: m.VnodeDOM) => {
          const input = vnode.dom as HTMLInputElement
          input.focus()
          input.setSelectionRange(this.editedProfileName.length, this.editedProfileName.length)
        },
        onkeydown: (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onProfileNameChange(this.editedProfileName)
            this.editMode = false
          }
        },
      }) : m("span.navbar-item", {style: {display: "flex", alignItems: "center"}}, [
        m("h1.title", {style: {marginBottom: "0", marginRight: ".5em"}}, profileName),
        m("button.button.is-light.is-small", {
          onclick: () => {
            this.editMode = true
            this.editedProfileName = profileName
          },
        }, [
          m("span.icon", [m("i.fas.fa-edit")])
        ])
      ]),
      ]),
      m(".navbar-menu", { class: this.burgerActive ? "is-active" : "" }, [
        m(".navbar-end", [
          m(
            "a.navbar-item",
            { href: "#!/profiles" },
            m(Icon, { class: "fas fa-arrow-left" }, "Back to Profiles")
          ),
          m(
            "a.navbar-item",
            {
              onclick: toggleConnection,
              title: "Click to " + (isConnected ? "disconnect" : "connect"), // Hover text
            },
            [
              m(Icon, {
                class: isConnected
                  ? "fa-solid fa-circle"
                  : "fa-regular fa-circle",
              }), // circle icons
              m("span", isConnected ? "Connected" : "Disconnected"),
            ]
          ),
        ]),
      ]),
    ])
  }
}
