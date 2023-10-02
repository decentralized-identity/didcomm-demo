import eventbus from "./eventbus"

export interface Contact {
  did: string
  label?: string
}

export interface Message {
  sender: string
  receiver: string
  timestamp: Date
  content: string
  type?: string
  raw?: any
}

export abstract class ContactService {
  _selectedContact?: Contact
  abstract getContacts(): Contact[]
  abstract getMessageHistory(did: string): Message[]
  abstract addContact(contact: Contact): void
  abstract getContact(did: string): Contact
  abstract saveMessageHistory(did: string, messages: Message[]): void
  abstract addMessage(did: string, message: Message): void
  selectContact(contact: Contact): void {
    this._selectedContact = contact
  }
  get selectedContact(): Contact {
    return this._selectedContact
  }
  onContactSelected(callback: (contact: Contact) => void): void {
    eventbus.emit("contact-selected", callback)
  }
}

export class NullContactService extends ContactService {
  contacts: Contact[] = [
    { label: "Alice", did: "did:example:alice" },
    { label: "Bob", did: "did:example:bob" },
    { label: "Carol", did: "did:example:carol" },
    { label: "Dave", did: "did:example:dave" },
  ]
  getContacts(): Contact[] {
    return this.contacts
  }
  getContact(did: string): Contact {
    return this.contacts.find(contact => contact.did === did)
  }
  getMessageHistory(did: string): Message[] {
    const history: { [did: string]: Message[] } = {
      "did:example:alice": [
        {
          sender: "Alice",
          receiver: "You",
          timestamp: new Date(),
          content: "Hello!",
        },
        {
          sender: "You",
          receiver: "Alice",
          timestamp: new Date(),
          content: "Hi!",
        },
        {
          sender: "Alice",
          receiver: "You",
          timestamp: new Date(),
          content: "How are you?",
        },
        {
          sender: "You",
          receiver: "Alice",
          timestamp: new Date(),
          content: "I'm doing well, how about you?",
        },
      ],
      "did:example:bob": [
        {
          sender: "Bob",
          receiver: "You",
          timestamp: new Date(),
          content: "Hey, you there?",
        },
        {
          sender: "You",
          receiver: "Bob",
          timestamp: new Date(),
          content: "Yeah, what's up?",
        },
        {
          sender: "Bob",
          receiver: "You",
          timestamp: new Date(),
          content: "Can you help me with something?",
        },
      ],
      "did:example:carol": [
        {
          sender: "Carol",
          receiver: "You",
          timestamp: new Date(),
          content: "Hey, you there?",
        },
        {
          sender: "You",
          receiver: "Carol",
          timestamp: new Date(),
          content: "Yeah, what's up?",
        },
        {
          sender: "Carol",
          receiver: "You",
          timestamp: new Date(),
          content: "Can you help me with something?",
        },
      ],
      "did:example:dave": [
        {
          sender: "Dave",
          receiver: "You",
          timestamp: new Date(),
          content: "Hey, you there?",
        },
      ],
    }
    return history[did]
  }

  addContact(contact: Contact): void {
    this.contacts.push(contact)
  }

  saveMessageHistory(did: string, messages: Message[]): void {}
  addMessage(did: string, message: Message): void {}
}

export class EphemeralContactService extends ContactService {
  private contacts: Record<string, Contact> = {}
  private messages: Record<string, Message[]> = {}

  getContacts(): Contact[] {
    return Object.values(this.contacts)
  }

  getContact(did: string): Contact {
    return this.contacts[did]
  }

  getMessageHistory(did: string): Message[] {
    return this.messages[did] || []
  }

  addContact(contact: Contact): void {
    this.contacts[contact.did] = contact
  }

  saveMessageHistory(did: string, messages: Message[]): void {
    this.messages[did] = messages
  }

  addMessage(did: string, message: Message): void {
    if (this.messages[did]) {
      this.messages[did].push(message)
    } else {
      this.messages[did] = [message]
    }
  }
}

export default new EphemeralContactService()
