import * as m from "mithril";
import ProfilesList from "../components/profileslist";
import NewProfile from "../components/newprofile";

class ProfilesPage implements m.ClassComponent {
  view() {
    return m("div", [
      m(ProfilesList),
      m("hr"),  // A simple horizontal line for visual separation
      m(NewProfile)
    ]);
  }
}

export default ProfilesPage;
