import ProfileService from "./profile"

export interface Contact {
  id: number
  label?: string
  did: string
}

export interface Message {
  sender: string
  receiver: string
  timestamp: Date
  content: string
}

export abstract class ContactService {
  abstract getContacts(): Contact[]
  abstract getMessageHistory(contactId: number): Message[]
  abstract addContact(contact: Partial<Contact>): void
}

export class NullContactService implements ContactService {
  contacts: Contact[] = [
    { id: 1, label: "Alice", did: "did:example:alice" },
    { id: 2, label: "Bob", did: "did:example:bob" },
    { id: 3, label: "Carol", did: "did:example:carol" },
    { id: 4, label: "Dave", did: "did:example:dave" },
  ]
  getContacts(): Contact[] {
    return this.contacts
  }
  getMessageHistory(contactId: number): Message[] {
    const history: { [contactId: number]: Message[] } = {
      1: [
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
      2: [
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
      3: [
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
      4: [
        {
          sender: "Dave",
          receiver: "You",
          timestamp: new Date(),
          content: "Hey, you there?",
        },
      ],
    }
    return history[contactId]
  }

  addContact(contact: Partial<Contact>): void {
    this.contacts.push({ id: this.contacts.length, ...contact } as Contact)
  }
}

export class LocalStorageContactService implements ContactService {
  private static CONTACTS_KEY = "contacts"
  private static MESSAGE_HISTORY_KEY = "messageHistory"

  private get profilePrefix(): string {
    return ProfileService.getActiveProfileId() + "_"
  }

  getContacts(): Contact[] {
    const contactsString = localStorage.getItem(
      this.profilePrefix + LocalStorageContactService.CONTACTS_KEY
    )
    console.log("Retrieved contacts:", contactsString)
    return contactsString ? JSON.parse(contactsString) : []
  }

  getMessageHistory(contactId: number): Message[] {
    return new NullContactService().getMessageHistory(1)
    const messageHistoryString = localStorage.getItem(
      this.profilePrefix +
        LocalStorageContactService.MESSAGE_HISTORY_KEY +
        contactId
    )
    return messageHistoryString ? JSON.parse(messageHistoryString) : []
  }

  addContact(contact: Partial<Contact>): void {
    const contacts = this.getContacts()
    let label = contact.label?.trim()
    if (!contact.did) {
      throw new Error("Contact must have a DID")
    }
    let did = contact.did.trim()
    const newContact: Contact = {
      label: label,
      did: did,
      id: Date.now(), // Using timestamp as a simple unique identifier
    }
    contacts.push(newContact)
    localStorage.setItem(
      this.profilePrefix + LocalStorageContactService.CONTACTS_KEY,
      JSON.stringify(contacts)
    )
  }

  // You may also want to add a method to save message history back to localStorage
  saveMessageHistory(contactId: number, messages: Message[]): void {
    localStorage.setItem(
      this.profilePrefix +
        LocalStorageContactService.MESSAGE_HISTORY_KEY +
        contactId,
      JSON.stringify(messages)
    )
  }
}

export default new LocalStorageContactService()
