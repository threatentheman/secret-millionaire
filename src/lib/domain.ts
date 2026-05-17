export type GamePhase =
  | "setup"
  | "survey"
  | "mulan"
  | "role_reveal"
  | "warmup_clue"
  | "team_assignment"
  | "main_challenge"
  | "armory_selection"
  | "armory"
  | "millionaire_secret_challenge"
  | "daily_clue"
  | "bazooka_window"
  | "day_complete"
  | "final_lock"
  | "final_reveal"
  | "complete";

export type GameStatus = "setup" | "active" | "locked" | "complete";
export type PlayerRole = "detective" | "millionaire";
export type ChallengeType = "main" | "millionaire_secret" | "mulan" | "warmup" | "final";
export type ClueDifficulty = "soft" | "medium" | "hard";
export type ClueSourceType = "survey" | "status" | "team" | "armory" | "bazooka";
export type NotificationAudience = "admin" | "player" | "tv" | "all";
export type MillionTransferReason =
  | "initial_assignment"
  | "bazooka_success"
  | "admin_move"
  | "secret_challenge_reward"
  | "armory_reward";
export type MillionaireChallengeStatus = "assigned" | "attempted" | "confirmed" | "rejected";
export type ArmoryRewardType =
  | "generated_clue"
  | "shield"
  | "double_vote"
  | "block_bazooka"
  | "million_movement_tracker"
  | "force_public_yes_no_question"
  | "restore_life";

export type UUID = string;

export type Game = {
  id: UUID;
  code: string;
  name: string;
  status: GameStatus;
  current_day: number;
  current_phase: GamePhase;
  million_holder_player_id: UUID | null;
  final_locked: boolean;
  created_at: string;
};

export type PublicGame = Omit<Game, "million_holder_player_id">;

export type Player = {
  id: UUID;
  game_id: UUID;
  name: string;
  role: PlayerRole;
  is_host: boolean;
  is_eliminated: boolean;
  extra_lives: number;
  bazooka_available: boolean;
  shield_active: boolean;
  current_team_id: UUID | null;
  avatar_emoji: string | null;
  device_session_id: string | null;
  login_email: string | null;
  auth_code_hash: string | null;
  joined_at: string;
};

export type PublicPlayer = Omit<Player, "role" | "device_session_id" | "login_email" | "auth_code_hash">;

export type SurveyQuestion = {
  id: UUID;
  game_id: UUID;
  question: string;
  question_type: string;
  clue_safe: boolean;
  created_at: string;
};

export type SurveyAnswerInput = {
  questionId: UUID;
  answer: string;
};

export type Team = {
  id: UUID;
  game_id: UUID;
  day: number;
  name: string;
  created_at: string;
};

export type GeneratedClue = {
  id: UUID;
  game_id: UUID;
  day: number;
  generated_for_player_id: UUID;
  source_type: ClueSourceType;
  clue_text: string;
  difficulty: ClueDifficulty;
  matching_player_count: number;
  released: boolean;
  recipient_player_id: UUID | null;
  created_at: string;
};

export type MillionaireChallenge = {
  id: UUID;
  game_id: UUID | null;
  title: string;
  description: string;
  difficulty: ClueDifficulty;
  reward_type: string;
  requires_narrator: boolean;
  active: boolean;
  created_at: string;
};

export type MillionaireChallengeAssignment = {
  id: UUID;
  game_id: UUID;
  challenge_id: UUID;
  day: number;
  millionaire_player_id: UUID;
  status: MillionaireChallengeStatus;
  narrator_confirmed: boolean;
  completed_at: string | null;
  created_at: string;
};

export type Notification = {
  id: UUID;
  game_id: UUID;
  recipient_player_id: UUID | null;
  audience: NotificationAudience;
  title: string;
  message: string;
  read_at: string | null;
  created_at: string;
};

export type PublicEvent = {
  id: UUID;
  game_id: UUID;
  event_type: string;
  title: string;
  message: string;
  show_on_tv: boolean;
  created_at: string;
};

export type EliminationVote = {
  id: UUID;
  game_id: UUID;
  day: number;
  voter_player_id: UUID;
  target_player_id: UUID;
  created_at: string;
};

export type EliminationTally = {
  playerId: UUID;
  playerName: string;
  avatarEmoji: string | null;
  votes: number;
  isEliminated: boolean;
};

export type AdminSnapshot = {
  game: Game;
  players: Player[];
  teams: Team[];
  clues: GeneratedClue[];
  events: PublicEvent[];
  notifications: Notification[];
  challenges: MillionaireChallenge[];
  assignments: MillionaireChallengeAssignment[];
  eliminationVotes: EliminationVote[];
  eliminationTallies: EliminationTally[];
  sentHomeCandidate: EliminationTally | null;
};

export type PlayerSnapshot = {
  game: PublicGame;
  player: Player;
  players: PublicPlayer[];
  teams: Team[];
  publicClues: GeneratedClue[];
  privateClues: GeneratedClue[];
  events: PublicEvent[];
  activeChallenge: (MillionaireChallengeAssignment & { challenge: MillionaireChallenge }) | null;
  eliminationVote: EliminationVote | null;
};

export type TvSnapshot = {
  game: PublicGame;
  players: PublicPlayer[];
  teams: Team[];
  publicClues: GeneratedClue[];
  events: PublicEvent[];
};
