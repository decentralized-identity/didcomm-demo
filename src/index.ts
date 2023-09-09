import * as m from "mithril"
import Layout from "./components/layout"

m.route(document.body, "/list", {
  "/list": {
    render() {
      return m(Layout)
    }
  }
})
