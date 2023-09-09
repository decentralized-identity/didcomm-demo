export interface Contact {
  id: number;
  name: string;
}

export interface Message {
  sender: string;
  receiver: string;
  timestamp: Date;
  content: string;
}

export abstract class ContactService {
  abstract getContacts(): Promise<Contact[]>;

  abstract getMessageHistory(contactId: number): Promise<Message[]>;
}

export class NullContactService implements ContactService {
  getContacts(): Promise<Contact[]> {
    return Promise.resolve([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
      { id: 3, name: "Carol" },
      { id: 4, name: "Dave" },
    ]);
  }
  getMessageHistory(contactId: number): Promise<Message[]> {
    const history: {[contactId: number]: Message[]} = {
      1: [
        { sender: "Alice", receiver: "You", timestamp: new Date(), content: "Hello!" },
        { sender: "You", receiver: "Alice", timestamp: new Date(), content: "Hi!" },
        { sender: "Alice", receiver: "You", timestamp: new Date(), content: "How are you?" },
        { sender: "You", receiver: "Alice", timestamp: new Date(), content: "I'm doing well, how about you?" },
      ],
      2: [
        { sender: "Bob", receiver: "You", timestamp: new Date(), content: "Hey, you there?" },
        { sender: "You", receiver: "Bob", timestamp: new Date(), content: "Yeah, what's up?" },
        { sender: "Bob", receiver: "You", timestamp: new Date(), content: "Can you help me with something?" },
      ],
      3: [
        { sender: "Carol", receiver: "You", timestamp: new Date(), content: "Hey, you there?" },
        { sender: "You", receiver: "Carol", timestamp: new Date(), content: "Yeah, what's up?" },
        { sender: "Carol", receiver: "You", timestamp: new Date(), content: "Can you help me with something?" },
      ],
      4: [
        { sender: "Dave", receiver: "You", timestamp: new Date(), content: "Hey, you there?" },
      ],
    }
    return Promise.resolve(history[contactId]);
  }
}
