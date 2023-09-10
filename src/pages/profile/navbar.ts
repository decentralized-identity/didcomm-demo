import * as m from "mithril"
import Icon from "../../components/icon"

import { library } from "@fortawesome/fontawesome-svg-core"
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons"
import { faCircle } from "@fortawesome/free-solid-svg-icons"

library.add(faArrowLeft, faCircle)

interface NavbarAttributes {
  profileName: string
  isConnected: boolean
  toggleConnection: () => void
}

export default class Navbar implements m.ClassComponent<NavbarAttributes> {
  private burgerActive: boolean = false

  view(vnode: m.Vnode<NavbarAttributes>) {
    const { profileName, isConnected, toggleConnection } = vnode.attrs

    return m("nav.navbar", [
      m(".navbar-brand", [
        m("span.navbar-item", m("h1.title", profileName)),

        // Burger Menu for mobile
        m(
          "a.navbar-burger.burger",
          {
            role: "button",
            class: this.burgerActive ? "is-active" : "",
            onclick: () => (this.burgerActive = !this.burgerActive),
          },
          [
            m("span", { "aria-hidden": "true" }),
            m("span", { "aria-hidden": "true" }),
            m("span", { "aria-hidden": "true" }),
          ]
        ),
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
