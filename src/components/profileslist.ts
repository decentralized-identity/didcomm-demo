import * as m from "mithril";

export default class ProfilesList implements m.Component {
  view() {
    const profileNames = Object.keys(localStorage)
    return m("div", profileNames.map(name => {
      return m("div.profile", {
        onclick: () => m.route.set("/profile/:id", { id: name })
      }, name)
    }))
  }
}
