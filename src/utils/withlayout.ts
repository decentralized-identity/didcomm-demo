import * as m from 'mithril';
import Layout from '../components/layout';

export function withLayout<C extends m.ComponentTypes<any>>(component: C): m.ComponentTypes {
    return {
        view: (vnode: m.CVnode) => m(Layout, m(component, vnode.attrs))
    };
}
