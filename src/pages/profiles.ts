import * as m from "mithril"
import ProfilesList from "../components/profileslist"
import NewProfile from "../components/newprofile"

class ProfilesPage implements m.ClassComponent {
  view() {
    return m(".container", [
      // Using the Bulma 'container' class
      m(".columns.is-centered", [
        // Using 'columns' to center the inner column and 'is-centered' to center the column content
        m(".column.is-5", [
          // 'is-5' gives the column a width of 5/12 of the parent container, which is around 42%. Adjust as needed.
          m("h1.title.is-1", "Profiles"), // Using the Bulma 'title' class
          m(ProfilesList),
          m("hr"), // A simple horizontal line for visual separation
          m(NewProfile),
        ]),
      ]),
    ])
  }
}

export default ProfilesPage
