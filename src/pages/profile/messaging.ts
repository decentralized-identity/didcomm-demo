// ContactListComponent.ts
import * as m from 'mithril';
import { NullContactService as ContactService, Contact, Message } from '../../lib/contacts';

interface ContactListComponentAttrs {
  onSelect: (contact: Contact) => void;
}

class ContactListComponent implements m.ClassComponent<ContactListComponentAttrs> {
  contacts: Contact[] = [];
  dataInterface = new ContactService();

  oninit() {
    this.dataInterface.getContacts().then((contacts: Contact[]) => this.contacts = contacts);
  }

  view(vnode: m.CVnode<ContactListComponentAttrs>) {
    return m(
      '.panel',
      m('.panel-heading', 'Contacts'),
      this.contacts.map(
        contact => 
        m('a.panel-block', {
          key: contact.id,
          onclick: () => vnode.attrs.onSelect(contact)
        }, [
          m('span.panel-icon', m('i.fas.fa-user')),
          m('span', contact.name)
        ])
      )
    );
  }
}

interface MessageHistoryComponentAttrs {
  contact: Contact;
  onBack: () => void;
}

class MessageHistoryComponent implements m.ClassComponent<MessageHistoryComponentAttrs> {
  messages: Message[] = [];
  dataInterface = new ContactService();

  oninit(vnode: m.CVnode<MessageHistoryComponentAttrs>) {
    this.dataInterface.getMessageHistory(vnode.attrs.contact.id).then((messages: Message[]) => this.messages = messages);
  }

  view(vnode: m.CVnode<MessageHistoryComponentAttrs>) {
    return m(
      'div',
      m('button.button.is-small.is-light', { onclick: vnode.attrs.onBack }, [
        m('span.icon', m('i.fas.fa-arrow-left')),
        m('span', 'Back to Contacts')
      ]),
      this.messages.map(
        message => 
        m('.box',
          m('.media',
            m('.media-content', [
              m('p.title.is-5', message.sender),
              m('p.subtitle.is-6', message.timestamp.toDateString()),
              m('p', message.content)
            ])
           )
         )
      )
    );
  }
}

export default class MessagingComponent implements m.ClassComponent {
  currentContact: Contact | null = null;

  view() {
    if (this.currentContact) {
      return m(MessageHistoryComponent, {
        contact: this.currentContact,
        onBack: () => this.currentContact = null
      });
    } else {
      return m(ContactListComponent, {
        onSelect: (contact: Contact) => this.currentContact = contact
      });
    }
  }
}

