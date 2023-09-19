import {DEFAULT_MEDIATOR_URL} from "../constants"

export interface Profile {
  label: string
  mediatorURL: string
}


const defaultActors: string[] = [
  "Alice",
  "Bob",
  "Carol",
  "Dave",
  "Eve",
  "Faythe",
  "Grace",
  "Heidi",
  "Ivan",
  "Judy",
  "Karl",
  "Lloyd",
  "Mallory",
  "Nia",
  "Oscar",
  "Peggy",
  "Quentin",
  "Rupert",
  "Sybil",
  "Trent",
  "Ursula",
  "Victor",
  "Walter",
  "Xavier",
  "Yvonne",
  "Zoe",
]


function getRandomActor(): string {
    const randomIndex = Math.floor(Math.random() * defaultActors.length);
    return defaultActors[randomIndex];
}


export default function generateProfile(options: Partial<Profile>): Profile {
  return {
    label: options.label || getRandomActor(),
    mediatorURL: options.mediatorURL || DEFAULT_MEDIATOR_URL,
  }
}
