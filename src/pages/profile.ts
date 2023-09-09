import * as m from "mithril";
import {Secret} from "../lib/profile";

interface ProfileAttributes {
  id: string;
}

export default class ProfilePage implements m.ClassComponent<ProfileAttributes> {
  id: string;
  secrets: Secret[] = []; // initialize with empty array or provide further logic
  
  view(vnode: m.Vnode<ProfileAttributes>) {
    return m("div", [
      m("h1", "Profile"),
      m("p", `Profile ID: ${vnode.attrs.id}`)
    ]);
  }
}
