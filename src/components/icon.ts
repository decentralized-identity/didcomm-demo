import * as m from "mithril";

interface IconAttributes {
  class: string;
}

export default class Icon implements m.ClassComponent<IconAttributes> {
  view(vnode: m.Vnode<IconAttributes>) {
    const { class: className } = vnode.attrs;
    if (!vnode.children) {
      return m("span.icon", m("i", { class: className }));
    }
    return m("span.icon-text", [
      m("span.icon", m("i", { class: className })),
      m("span", vnode.children)
    ]);
  }
}
