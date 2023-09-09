import * as m from "mithril";
import { withLayout } from "./utils/withlayout";
import ProfilesPage from "./pages/profiles";
import ProfilePage from "./pages/profile";

m.route(document.body, "/profiles", {
  "/profile/:id": withLayout(ProfilePage),
  "/profiles": withLayout(ProfilesPage)
});
