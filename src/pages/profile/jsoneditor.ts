import * as m from "mithril"
import "prismjs"
import "lit-code"

import "prismjs/components/prism-json"
import "prismjs/themes/prism.css"

class JSONEditorAttributes {
  content: string
}

export default class JSONEditor
  implements m.ClassComponent<JSONEditorAttributes>
{
  private content: string = ""

  oninit(vnode: m.Vnode<JSONEditorAttributes>) {
    this.content = vnode.attrs.content
  }

  oncreate(vnode: m.VnodeDOM<JSONEditorAttributes>) {
    const editor = vnode.dom as any
    editor.setCode(this.content)
  }

  onupdate(vnode: m.VnodeDOM<JSONEditorAttributes>) {
    if (this.content !== vnode.attrs.content) {
      this.content = vnode.attrs.content

      const editor = vnode.dom as any
      editor.setCode(this.content)
    }
  }

  view() {
    return m("lit-code", {
      language: "json",
      linenumbers: true,
      onupdate: (e: any) => {},
    })
  }
}
