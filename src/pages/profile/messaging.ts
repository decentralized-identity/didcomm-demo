// ContactListComponent.ts
import * as m from 'mithril';
import { default as ContactService, Contact, Message } from '../../lib/contacts';

interface ContactListComponentAttrs {
  onSelect: (contact: Contact) => void;
}

class ContactListComponent implements m.ClassComponent<ContactListComponentAttrs> {
  contacts: Contact[] = [];
  isModalOpen: boolean = false;
  newContact: Partial<Contact> = {};

  oninit() {
    this.contacts = ContactService.getContacts();
  }

  onAddContact() {
    if (this.newContact.did) {
      ContactService.addContact(this.newContact)
      this.contacts = ContactService.getContacts();
      this.isModalOpen = false;
    }
  }

  view(vnode: m.CVnode<ContactListComponentAttrs>) {
    return m('div', [
      // Contacts Panel
      m('.panel',
        m('.panel-heading',
          m('div.level', [
            m('div.level-left', m('p', 'Contacts')),
            m('div.level-right',
              m('button.button.is-small.is-primary.is-light', { onclick: () => this.isModalOpen = true }, [
                m('span.icon', m('i.fas.fa-plus')),
                m('span', 'New Contact')
              ])
            )
          ])
        ),
        this.contacts.map(contact =>
          m('a.panel-block', {
            key: contact.id,
            onclick: () => vnode.attrs.onSelect(contact)
          }, [
            m('span.panel-icon', m('i.fas.fa-user')),
            m('span', contact.label || contact.did)
          ])
        )
      ),
      // New Contact Modal
      this.isModalOpen && m('.modal.is-active', [
        m('.modal-background', { onclick: () => this.isModalOpen = false }),
        m('.modal-card', [
          m('header.modal-card-head', [
            m('p.modal-card-title', 'Add New Contact'),
            m('button.delete', { 'aria-label': 'close', onclick: () => this.isModalOpen = false })
          ]),
          m('section.modal-card-body', [
            m('.field', [
              m('label.label', 'DID'),
              m('div.control', m('input.input[type=text][placeholder="DID of the contact"]', {
                oninput: (e: Event) => this.newContact.did = (e.target as HTMLInputElement).value
              }))
            ]),
            m('.field', [
              m('label.label', 'Label (optional)'),
              m('div.control', m('input.input[type=text][placeholder="Label for the contact"]', {
                oninput: (e: Event) => this.newContact.label = (e.target as HTMLInputElement).value
              }))
            ])
          ]),
          m('footer.modal-card-foot', [
            m('button.button.is-success', { onclick: () => this.onAddContact() }, 'Save'),
            m('button.button', { onclick: () => this.isModalOpen = false }, 'Cancel')
          ])
        ])
      ])
    ]);
  }
}

interface MessageHistoryComponentAttrs {
  contact: Contact;
  onBack: () => void;
}

class MessageHistoryComponent implements m.ClassComponent<MessageHistoryComponentAttrs> {
  messages: Message[] = [];

  oninit(vnode: m.CVnode<MessageHistoryComponentAttrs>) {
    this.messages = ContactService.getMessageHistory(vnode.attrs.contact.id);
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

