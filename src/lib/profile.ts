export interface Profile {
  label: string
  did?: string
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
  const randomIndex = Math.floor(Math.random() * defaultActors.length)
  return defaultActors[randomIndex]
}

let profile: Profile
export function generateProfile(options: Partial<Profile>): Profile {
  profile = {
    label: options.label || getRandomActor(),
  }
  return profile
}
export default profile
