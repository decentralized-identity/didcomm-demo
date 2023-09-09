import * as m from "mithril";
import { CodeJar } from "codejar";
import { highlight as hl, languages} from "prismjs";

import "prismjs/components/prism-json";
import "prismjs/themes/prism.css";

export default class JSONEditor implements m.ClassComponent {
  editor: any;
  content: string = ''; // You can initialize this with default JSON if needed

  oncreate(vnode: m.CVnodeDOM) {
    // Define a highlighting function
    const highlight = (editor: HTMLElement) => {
      const code = editor.textContent || "";
      editor.innerHTML = hl(code, languages.json, "json");
    };

    this.editor = CodeJar(vnode.dom as HTMLElement, highlight, {
      tab: "  " // using two spaces for tab
    });

    this.editor.updateCode(this.content);
  }

  view() {
    return m('pre', {style: "padding: 0; margin: 0; height: 100%;"}, m('code.language-json', this.content));
  }

  onremove() {
    this.editor.destroy(); // Cleanup the editor instance on component removal
  }
}
