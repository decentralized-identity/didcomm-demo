import * as m from "mithril";

interface NewProfileState {
  isCreating: boolean;
  profileName: string;
}

class NewProfile implements m.ClassComponent<NewProfileState> {
  isCreating: boolean = false;
  profileName: string = "";

  view() {
    if (this.isCreating) {
      return m("div", { style: { display: "flex", alignItems: "center" } },
        m("input", {
          style: { marginRight: "10px" },
          placeholder: "Profile Name",
          value: this.profileName,
          oninput: (e: Event) => this.profileName = (e.target as HTMLInputElement).value
        }),
        m("button", {
          onclick: () => {
            if (this.profileName) {
              // Stub: Add logic to generate secrets here

              // Store the profile in localStorage
              localStorage.setItem(this.profileName, JSON.stringify({ secrets: [] }));

              // Reset state
              this.isCreating = false;
              this.profileName = "";
              
              // Refresh or re-route as needed to update the profile list display
              m.redraw();
            }
          }
        }, "+")
      );
    } else {
      return m("button", {
        onclick: () => this.isCreating = true
      }, "Create New Profile +");
    }
  }
}

export default NewProfile;
