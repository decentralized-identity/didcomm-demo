import * as m from "mithril"
import { withLayout } from "./utils/withlayout"
import ProfilePage from "./pages/profile"

import "bulma/css/bulma.css"
import "@fortawesome/fontawesome-free/css/all.css"

window.addEventListener("beforeunload", event => {
  event.returnValue = "Are you sure you want to leave? All data will be lost!"
})

m.route(document.body, "/", {
  "/": withLayout(ProfilePage),
  "/:actor": withLayout(ProfilePage),
})
