import * as m from "mithril"

export default {
  view: (vnode: m.Vnode) => {
    return m("main.layout container", [m("section", vnode.children)])
  },
} as m.Component
