import * as m from 'mithril';

import helpContent from '../../../docs/help.md'
import "./help.css"

interface ModalAttrs {
  isActive: boolean
  onClose: () => void
}

export default class Modal implements m.ClassComponent<ModalAttrs> {
  view(vnode: m.Vnode<ModalAttrs>) {
    return vnode.attrs.isActive ? m('div.modal.is-active', [
      m('div.modal-background', { onclick: vnode.attrs.onClose }),
      m('div.modal-content.content', m.trust(helpContent)),
      m('button.modal-close.is-large', { ariaLabel: "close", onclick: vnode.attrs.onClose })
    ]) : null;
  }
}
