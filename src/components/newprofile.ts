import * as m from "mithril"
import { DEFAULT_MEDIATOR_URL } from "../constants"
import ProfileService from "../lib/profile"

interface NewProfileState {
  isCreating: boolean
  profileName: string
  showMediatorURL: boolean
  mediatorURL: string
}

interface OptionalInputAttributes {
  placeholder: string
  oninput: (value: string) => void
}

class OptionalInputElement
  implements m.ClassComponent<OptionalInputAttributes>
{
  isEditing: boolean = false
  value: string = ""

  view(vnode: m.Vnode<OptionalInputAttributes>) {
    if (this.isEditing) {
      return m("input.input", {
        placeholder: vnode.attrs.placeholder,
        value: this.value,
        oninput: (e: Event) => {
          const newValue = (e.target as HTMLInputElement).value
          this.value = newValue
          vnode.attrs.oninput(newValue)
        },
        onblur: () => {
          if (!this.value) {
            this.isEditing = false
          }
        },
      })
    } else {
      return m(
        "button.button",
        {
          onclick: () => (this.isEditing = true),
        },
        vnode.attrs.placeholder
      )
    }
  }
}

class NewProfile implements m.ClassComponent<NewProfileState> {
  isCreating: boolean = false
  profileName: string = ""
  showMediatorURL: boolean = false
  mediatorURL: string = ""

  view() {
    if (this.isCreating) {
      return m("div", [
        m(".field.is-grouped", [
          m(".control.is-expanded", [
            m("input.input", {
              placeholder: "Profile Name",
              value: this.profileName,
              oninput: (e: Event) =>
                (this.profileName = (e.target as HTMLInputElement).value),
            }),
          ]),
          m(".control", [
            m(
              "button.button.is-primary",
              {
                onclick: () => {
                  if (this.profileName) {
                    // Stub: Add logic to generate secrets here

                    // Store the profile in localStorage
                    ProfileService.saveProfile({
                      id: this.profileName,
                      mediatorURL: this.mediatorURL || DEFAULT_MEDIATOR_URL,
                      secrets: [],
                    })

                    // Reset state
                    this.isCreating = false
                    this.profileName = ""
                    this.mediatorURL = ""

                    // Refresh or re-route as needed to update the profile list display
                    m.redraw()
                  }
                },
              },
              "+"
            ),
          ]),
        ]),
        m(".field", { style: { marginTop: "10px" } }, [
          m(OptionalInputElement, {
            placeholder: "Add Mediator URL",
            oninput: (value: string) => {
              this.showMediatorURL = true
              this.mediatorURL = value
            },
          }),
          // Add more optional input elements here in the future as needed.
        ]),
      ])
    } else {
      return m(
        "button.button.is-primary",
        {
          onclick: () => (this.isCreating = true),
        },
        "Create New Profile +"
      )
    }
  }
}

export default NewProfile
