import * as m from "mithril"

export default {
  view: (vnode: m.Vnode) => {
    return m("main.layout", [
      m("nav.menu", [
        m("a", { href: "#!/list" }, "Users")
      ]),
      m("section", vnode.children),
    ])
  }
} as m.Component
