import type { ClueDifficulty } from "./domain";

export const surveyQuestions = [
  "What month were you born?",
  "What is your star sign?",
  "How many siblings do you have?",
  "Are you the oldest, middle, youngest, or only child?",
  "What city were you born in?",
  "Are you left-handed or right-handed?",
  "Do you prefer mornings or nights?",
  "Do you prefer pool or beach?",
  "Do you prefer sweet or savoury?",
  "Tea, coffee, or neither?",
  "What is your current phone battery percentage?",
  "iPhone or Android?",
  "What colour are you wearing right now?",
  "How many countries have you visited?",
  "Can you swim?",
  "Who in the villa do you trust most?",
  "Who in the villa do you trust least?",
  "Who do you think would lie the best?",
  "Who would hide the Million best?",
  "Who would spend the prize money fastest?",
  "Who is most likely to betray their team?",
  "Who is most likely to panic under pressure?",
  "Who is most likely to win this game?",
  "Who is most likely to fake innocence?",
  "Who is most likely to over-explain?",
  "Who is most likely to stay quiet and watch?",
  "Are you more strategic or chaotic?",
  "Are you more competitive or unserious?",
  "Would you rather win quietly or dramatically?",
  "Would you rather be feared or trusted?",
  "Are you better at lying or spotting lies?",
  "Would you sacrifice a teammate to win?",
  "Would you use your bazooka early or save it?",
  "Would you rather have a clue or a shield?",
  "Would you rather enter the Armory or avoid suspicion?",
  "Would you rather move the Million or protect the Million?",
  "What is the most rich-person thing about you?",
  "Who gives millionaire energy?",
  "Who would pretend not to care but secretly care most?",
  "Who would make the best villain?",
  "Who would accidentally expose themselves?"
] as const;

export type SeedChallenge = {
  title: string;
  description: string;
  difficulty: ClueDifficulty;
  reward_type: string;
};

export const millionaireChallengeLibrary: SeedChallenge[] = [
  { title: "Say the phrase 10 times", description: "Say a specific phrase 10 times before the next clue. Example phrases: \"That's suspicious\", \"I don't trust anyone here\", \"This villa has bad energy\", \"Someone is moving weird\", \"I would never lie\".", difficulty: "soft", reward_type: "shield" },
  { title: "Start a suspicion conversation", description: "Get at least 3 people talking about who they suspect.", difficulty: "soft", reward_type: "move_million" },
  { title: "Ask someone if they trust you", description: "Ask 3 different players \"Do you trust me?\"", difficulty: "soft", reward_type: "block_bazooka" },
  { title: "Do a dance move", description: "Perform the same dance move 5 times naturally without being called out.", difficulty: "soft", reward_type: "shield" },
  { title: "Say someone's name repeatedly", description: "Mention one player's name at least 8 times in group conversation.", difficulty: "soft", reward_type: "scramble_clue" },
  { title: "Take one item from each person", description: "Collect one small item from at least 5 players. Items can include hair tie, lighter, sunglasses, room key, lip balm, flip flop, cup.", difficulty: "medium", reward_type: "move_million" },
  { title: "Jump in the pool 6 times", description: "Jump in the pool 6 times before the end of the day.", difficulty: "medium", reward_type: "steal_life" },
  { title: "Convince someone to accuse another player", description: "Get one player to openly accuse someone else.", difficulty: "medium", reward_type: "move_million" },
  { title: "Make someone defend you", description: "Get another player to say \"I don't think it's them\" or equivalent.", difficulty: "medium", reward_type: "shield" },
  { title: "Get someone to give you something", description: "Convince 3 players to voluntarily hand you an item.", difficulty: "medium", reward_type: "block_bazooka" },
  { title: "Create a false theory", description: "Make a theory about another player that at least 2 people repeat later.", difficulty: "medium", reward_type: "scramble_clue" },
  { title: "Become team leader", description: "Get your team to let you lead the main challenge.", difficulty: "hard", reward_type: "choose_next_teams" },
  { title: "Make two people accuse each other", description: "Cause two different players to accuse each other publicly.", difficulty: "hard", reward_type: "move_million_and_shield" },
  { title: "Win without looking suspicious", description: "Be on the winning team but receive no suspicion mentions during the day.", difficulty: "hard", reward_type: "double_bazooka_protection" },
  { title: "Get someone to waste their Bazooka", description: "Convince someone to fire their Bazooka incorrectly.", difficulty: "hard", reward_type: "move_million_and_steal_life" },
  { title: "Publicly accuse yourself and survive", description: "Say something that makes people suspicious of you, but avoid being Bazooka'd for 30 minutes.", difficulty: "hard", reward_type: "scramble_clue_and_shield" }
];

export const scheduleItems = [
  { day: "Tonight", items: ["Player join", "Survey", "Role reveal", "Mulan intro game", "Award extra lives to Mulan winners", "Phone Silence clue challenge", "Warm-up clue"] },
  { day: "Monday", items: ["Main challenge: General Knowledge", "Winning team chooses Armory entrant", "Armory clue/power", "Millionaire secret challenge", "Daily clue", "Bazooka window"] },
  { day: "Tuesday", items: ["Main challenge: Hide & Seek Items", "Winning team chooses Armory entrant", "Armory clue/power", "Millionaire secret challenge", "Daily clue", "Bazooka window"] },
  { day: "Wednesday", items: ["Main challenge: Where's the Bean", "Final Armory", "Final Millionaire secret challenge", "Final clue", "Final Bazooka window", "Final lock", "Final reveal", "Winner gets free dinner"] }
];
