import * as m from "mithril"
import Icon from "../../components/icon"

import "./navbar.css"

import { library } from "@fortawesome/fontawesome-svg-core"
import { faArrowLeft, faCircle, faEdit, faRefresh } from "@fortawesome/free-solid-svg-icons"
import agent from "../../lib/agent"

library.add(faArrowLeft, faCircle, faEdit)

interface NavbarAttributes {
  profileName: string
  did?: string
  isConnected: boolean
  toggleConnection: () => void
  onProfileNameChange: (newName: string) => void
}

export default class Navbar implements m.ClassComponent<NavbarAttributes> {
  private burgerActive: boolean = false
  private editMode: boolean = false
  private editedProfileName: string = ""
  private didCopied: boolean = false

  private showToast(message: string, duration: number = 2000) {
    // Create a div element for the toast
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

    // Append it to the body
    document.body.appendChild(toast);

    // Force a reflow to trigger the transition
    void toast.offsetWidth;

    // Show the toast
    toast.classList.add('show');

    // Remove the toast after the specified duration
    setTimeout(() => {
      toast.classList.remove('show');

      // Wait for the transition to finish before removing the element
      toast.addEventListener('transitionend', () => {
        document.body.removeChild(toast);
      });
    }, duration);
  }

  private copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.didCopied = true;
      m.redraw();  // Inform Mithril to redraw the component

      // Reset after some time (e.g., 2 seconds)
      setTimeout(() => {
        this.didCopied = false;
        m.redraw();
      }, 2000);

      // Show the toast
      // Assuming you have a toast library/method named `showToast`
      this.showToast("Copied!");

    }).catch(err => {
      console.error("Failed to copy text: ", err);
    });
  }

  refreshMessages() {
    agent.refreshMessages()
  }

  view(vnode: m.Vnode<NavbarAttributes>) {
    const { profileName, isConnected, did, toggleConnection, onProfileNameChange } = vnode.attrs
    const truncatedDid = did && did.length > 20 ? `${did.slice(0, 20)}...` : did;

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
        m("button.button.is-white.is-small", {
          onclick: () => {
            this.editMode = true
            this.editedProfileName = profileName
          },
          style: {marginRight: ".5em"}
        }, [
          m("span.icon", [m("i.fas.fa-edit")])
        ]),
        truncatedDid && m("span", {style: {marginRight: ".5em"}},`(${truncatedDid})`),
        did && m("button.button.is-small.is-white", {
          onclick: () => this.copyToClipboard(did),
          class: this.didCopied ? "is-success" : "",
          title: "Copy DID to clipboard"
        }, 
        m("span.icon",
          m("i", { class: this.didCopied ? "fa-solid fa-check" : "fa-solid fa-copy" })
         )
        )
      ]),
      ]),
      m(".navbar-menu", { class: this.burgerActive ? "is-active" : "" }, [
        m(".navbar-end", {style: {display: "flex", alignItems: "center"}}, [
          m("button.button.is-white", {
            onclick: () => {
              this.refreshMessages()
            },
            style: {marginRight: ".5em"},
            title: "Refresh messages"
          }, [
            m("span.icon", [m("i.fas.fa-refresh")])
          ]),
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
