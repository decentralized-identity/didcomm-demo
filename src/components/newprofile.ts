import * as m from "mithril";
import { DEFAULT_MEDIATOR_URL } from "../constants";

interface NewProfileState {
  isCreating: boolean;
  profileName: string;
  showMediatorURL: boolean;
  mediatorURL: string;
}

interface OptionalInputAttributes {
  placeholder: string;
  oninput: (value: string) => void;
}

class OptionalInputElement implements m.ClassComponent<OptionalInputAttributes> {
  isEditing: boolean = false; // Start off with the button displayed by default
  value: string = "";

  view(vnode: m.Vnode<OptionalInputAttributes>) {
    if (this.isEditing) {
      return m("input", {
        placeholder: vnode.attrs.placeholder,
        value: this.value,
        oninput: (e: Event) => {
          const newValue = (e.target as HTMLInputElement).value;
          this.value = newValue;
          vnode.attrs.oninput(newValue);
        },
        onblur: () => {
          if (!this.value) {
            this.isEditing = false;
          }
        }
      });
    } else {
      return m("button", {
        onclick: () => this.isEditing = true
      }, vnode.attrs.placeholder);
    }
  }
}

class NewProfile implements m.ClassComponent<NewProfileState> {
  isCreating: boolean = false;
  profileName: string = "";
  showMediatorURL: boolean = false;
  mediatorURL: string = "";

  view() {
    if (this.isCreating) {
      return m("div", [
        m("div", { style: { display: "flex", alignItems: "center" } },
          m(".input-group", [
            m("input.form-control", {
              placeholder: "Profile Name",
              value: this.profileName,
              oninput: (e: Event) => this.profileName = (e.target as HTMLInputElement).value
            }),
            m(".input-group-append", [
              m("button.btn btn-primary", {
                onclick: () => {
                  if (this.profileName) {
                    // Stub: Add logic to generate secrets here

                    // Store the profile in localStorage
                    localStorage.setItem(
                      this.profileName,
                      JSON.stringify({
                        mediatorURL: this.mediatorURL || DEFAULT_MEDIATOR_URL,
                        secrets: []
                      })
                    );

                    // Reset state
                    this.isCreating = false;
                    this.profileName = "";
                    this.mediatorURL = "";
                    
                    // Refresh or re-route as needed to update the profile list display
                    m.redraw();
                  }
                }
              }, "+")
            ])
          ])
        ),
        m("div", { style: { marginTop: "10px" } }, [
          m(OptionalInputElement, {
            placeholder: "Add Mediator URL",
            oninput: (value: string) => {
              this.showMediatorURL = true;
              this.mediatorURL = value;
            }
          })
          // Add more optional input elements here in the future as needed.
        ])
      ]);
    } else {
      return m("button.btn btn-primary", {
        onclick: () => this.isCreating = true
      }, "Create New Profile +");
    }
  }
}

export default NewProfile;
