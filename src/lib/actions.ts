"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import {
  AdminSnapshot,
  ArmoryRewardType,
  ClueDifficulty,
  ClueSourceType,
  EliminationTally,
  EliminationVote,
  Game,
  GamePhase,
  GeneratedClue,
  MillionaireChallenge,
  MillionaireChallengeAssignment,
  MillionTransferReason,
  Notification,
  Player,
  PlayerSnapshot,
  PlayerSelf,
  PublicEvent,
  PublicGame,
  PublicPlayer,
  SafeGeneratedClue,
  SurveyAnswerInput,
  SurveyQuestion,
  Team,
  TvSnapshot,
  UUID
} from "./domain";
import { clearAdminSession, requireAdminSession, setAdminSession, validateAdminCredentials } from "./admin-auth";
import { millionaireChallengeLibrary, surveyQuestions } from "./seed";
import { createServiceClient } from "./supabase";

type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };
type DbResult<T> = { data: T | null; error: { message: string } | null };
type DbListResult<T> = { data: T[] | null; error: { message: string } | null };

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

export async function adminLogin(email: string, password: string): Promise<ActionResult<{ signedIn: true }>> {
  if (!validateAdminCredentials(email, password)) {
    return { ok: false, error: "Incorrect admin email or password." };
  }
  await setAdminSession();
  return { ok: true, data: { signedIn: true } };
}

export async function adminLogout(): Promise<ActionResult<{ signedOut: true }>> {
  await clearAdminSession();
  return { ok: true, data: { signedOut: true } };
}

export async function playerLogout(gameCode: string): Promise<ActionResult<{ signedOut: true }>> {
  const cookieStore = await cookies();
  cookieStore.set(playerCookieName(gameCode), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
  return { ok: true, data: { signedOut: true } };
}

function shortCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 5 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashAuthCode(gameId: UUID, email: string, authCode: string) {
  return createHash("sha256").update(`${gameId}:${normalizeEmail(email)}:${authCode}`).digest("hex");
}

function playerCookieName(gameCode: string) {
  return `sm-player-${normalizeCode(gameCode)}`;
}

function publicGame(game: Game): PublicGame {
  const { million_holder_player_id: _hidden, ...safeGame } = game;
  return safeGame;
}

function playerSelf(player: Player): PlayerSelf {
  const { device_session_id: _session, login_email: _email, auth_code_hash: _hash, ...safePlayer } = player;
  return safePlayer;
}

function publicPlayer(player: Player): PublicPlayer {
  const { role: _role, device_session_id: _session, login_email: _email, auth_code_hash: _hash, ...safePlayer } = player;
  return safePlayer;
}

function safeClue(clue: GeneratedClue): SafeGeneratedClue {
  const { generated_for_player_id: _holder, ...safe } = clue;
  return safe;
}

function requireData<T>(result: DbResult<T> | DbListResult<T>, fallback: string): T | T[] {
  if (result.error) {
    throw new Error(result.error.message);
  }
  if (!result.data) {
    throw new Error(fallback);
  }
  return result.data;
}

async function getGameByCode(code: string): Promise<Game> {
  const supabase = createServiceClient();
  const result = await supabase.from("games").select("*").eq("code", normalizeCode(code)).single() as DbResult<Game>;
  return requireData<Game>(result, "Game not found.") as Game;
}

async function setPlayerSessionCookie(gameCode: string, deviceSessionId: string) {
  const cookieStore = await cookies();
  cookieStore.set(playerCookieName(gameCode), deviceSessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

async function requirePlayerSession(game: Game, playerId: UUID): Promise<Player> {
  const cookieStore = await cookies();
  const deviceSessionId = cookieStore.get(playerCookieName(game.code))?.value;
  if (!deviceSessionId) {
    throw new Error("Player session expired. Log in again.");
  }
  const supabase = createServiceClient();
  const result = await supabase
    .from("players")
    .select("*")
    .eq("id", playerId)
    .eq("game_id", game.id)
    .eq("device_session_id", deviceSessionId)
    .single() as DbResult<Player>;
  return requireData<Player>(result, "Player session expired. Log in again.") as Player;
}

function assertAdminTarget(playerId: UUID) {
  if (!playerId) {
    throw new Error("Select a player target first.");
  }
}

async function insertNotification(gameId: UUID, title: string, message: string, audience: Notification["audience"], recipientPlayerId?: UUID) {
  const supabase = createServiceClient();
  await supabase.from("notifications").insert({
    game_id: gameId,
    title,
    message,
    audience,
    recipient_player_id: recipientPlayerId ?? null
  });
}

async function insertPublicEvent(gameId: UUID, eventType: string, title: string, message: string, showOnTv = true) {
  const supabase = createServiceClient();
  await supabase.from("public_events").insert({
    game_id: gameId,
    event_type: eventType,
    title,
    message,
    show_on_tv: showOnTv
  });
}

export async function createGame(name = "Secret Millionaire: Bali Villa Edition"): Promise<ActionResult<{ code: string }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    let game: Game | null = null;

    for (let attempt = 0; attempt < 8 && !game; attempt += 1) {
      const result = await supabase.from("games").insert({ code: shortCode(), name }).select("*").single() as DbResult<Game>;
      if (!result.error && result.data) {
        game = result.data;
      }
    }

    if (!game) {
      throw new Error("Could not create a unique game code.");
    }

    await supabase.from("survey_questions").insert(
      surveyQuestions.map((question) => ({ game_id: game.id, question, question_type: "text", clue_safe: true }))
    );
    await supabase.from("millionaire_challenges").insert(
      millionaireChallengeLibrary.map((challenge) => ({ ...challenge, game_id: game.id, requires_narrator: true, active: true }))
    );
    await insertPublicEvent(game.id, "game_created", "Bali Villa Edition", "The game room is open.", true);
    revalidatePath("/admin");
    return { ok: true, data: { code: game.code } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Create game failed." };
  }
}

export async function getAdminGames(): Promise<Game[]> {
  await requireAdminSession();
  const supabase = createServiceClient();
  const result = await supabase
    .from("games")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20) as DbListResult<Game>;

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data ?? [];
}

async function isSurveyComplete(gameId: UUID, playerId: UUID) {
  const supabase = createServiceClient();
  const [questionsResult, answersResult] = await Promise.all([
    supabase.from("survey_questions").select("id", { count: "exact", head: true }).eq("game_id", gameId),
    supabase.from("survey_answers").select("id", { count: "exact", head: true }).eq("game_id", gameId).eq("player_id", playerId)
  ]);
  const questionCount = questionsResult.count ?? 0;
  const answerCount = answersResult.count ?? 0;
  return questionCount > 0 && answerCount >= questionCount;
}

export async function hasCompletedSurvey(gameCode: string, playerId: UUID): Promise<boolean> {
  const game = await getGameByCode(gameCode);
  await requirePlayerSession(game, playerId);
  return isSurveyComplete(game.id, playerId);
}

export async function joinGame(gameCode: string, name: string, avatarEmoji: string, email: string, authCode: string, deviceSessionId: string): Promise<ActionResult<{ playerId: UUID; code: string; surveyComplete: boolean }>> {
  try {
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    const cleanName = name.trim();
    const cleanEmail = normalizeEmail(email);
    const cleanAuthCode = authCode.trim();
    if (!cleanName) {
      throw new Error("Enter a name.");
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Enter an email address.");
    }
    if (cleanAuthCode.length < 4) {
      throw new Error("Choose a private code with at least 4 characters.");
    }
    const authCodeHash = hashAuthCode(game.id, cleanEmail, cleanAuthCode);
    const existing = await supabase
      .from("players")
      .select("*")
      .eq("game_id", game.id)
      .eq("login_email", cleanEmail)
      .maybeSingle() as DbResult<Player>;

    if (existing.data) {
      if (existing.data.auth_code_hash !== authCodeHash) {
        throw new Error("That email is already in this game, but the private code did not match.");
      }
      await supabase.from("players").update({ device_session_id: deviceSessionId, name: cleanName, avatar_emoji: avatarEmoji || existing.data.avatar_emoji }).eq("id", existing.data.id);
      await setPlayerSessionCookie(game.code, deviceSessionId);
      const surveyComplete = await isSurveyComplete(game.id, existing.data.id);
      return { ok: true, data: { playerId: existing.data.id, code: game.code, surveyComplete } };
    }

    const inserted = await supabase
      .from("players")
      .insert({
        game_id: game.id,
        name: cleanName,
        avatar_emoji: avatarEmoji || null,
        device_session_id: deviceSessionId,
        login_email: cleanEmail,
        auth_code_hash: authCodeHash
      })
      .select("*")
      .single() as DbResult<Player>;
    const player = requireData<Player>(inserted, "Could not join game.") as Player;
    await setPlayerSessionCookie(game.code, deviceSessionId);
    await insertPublicEvent(game.id, "player_joined", "Player joined", `${player.avatar_emoji ?? "◇"} ${player.name} entered the villa.`, true);
    revalidatePath(`/game/${game.code}`);
    return { ok: true, data: { playerId: player.id, code: game.code, surveyComplete: false } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Join failed." };
  }
}

export async function submitSurvey(gameCode: string, playerId: UUID, answers: SurveyAnswerInput[]): Promise<ActionResult<{ saved: number }>> {
  try {
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await requirePlayerSession(game, playerId);
    const questionsResult = await supabase.from("survey_questions").select("*").eq("game_id", game.id).order("created_at") as DbListResult<SurveyQuestion>;
    const questions = questionsResult.data ?? [];
    const questionIds = new Set(questions.map((question) => question.id));
    const rows = answers
      .filter((answer) => answer.answer.trim().length > 0)
      .filter((answer) => questionIds.has(answer.questionId))
      .map((answer) => ({
        game_id: game.id,
        player_id: playerId,
        question_id: answer.questionId,
        answer: answer.answer.trim()
      }));

    if (rows.length !== questions.length) {
      throw new Error("Answer every survey question before continuing.");
    }

    const result = await supabase.from("survey_answers").upsert(rows, { onConflict: "player_id,question_id" });
    if (result.error) {
      throw new Error(result.error.message);
    }
    revalidatePath(`/game/${game.code}`);
    return { ok: true, data: { saved: rows.length } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Survey failed." };
  }
}

export async function setGamePhase(gameCode: string, phase: GamePhase): Promise<ActionResult<GamePhase>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await supabase.from("games").update({ current_phase: phase, status: phase === "complete" ? "complete" : "active" }).eq("id", game.id);
    await insertPublicEvent(game.id, "phase_changed", "Phase changed", `Current phase: ${phase.replaceAll("_", " ")}.`, true);
    revalidatePath(`/admin/${game.code}`);
    return { ok: true, data: phase };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Phase update failed." };
  }
}

export async function setCurrentDay(gameCode: string, day: number): Promise<ActionResult<number>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await supabase.from("games").update({ current_day: day }).eq("id", game.id);
    await insertPublicEvent(game.id, "day_changed", "Game day updated", `Day ${day} is now active.`, true);
    revalidatePath(`/admin/${game.code}`);
    return { ok: true, data: day };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Day update failed." };
  }
}

export async function assignInitialMillion(gameCode: string): Promise<ActionResult<{ holderName: string }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    const playersResult = await supabase.from("players").select("*").eq("game_id", game.id).eq("is_host", false).eq("is_eliminated", false) as DbListResult<Player>;
    const players = requireData<Player[]>(playersResult, "No players found.") as Player[];
    if (players.length === 0) {
      throw new Error("Add at least one non-host player first.");
    }
    const holder = players[Math.floor(Math.random() * players.length)];
    await supabase.from("players").update({ role: "detective" }).eq("game_id", game.id);
    await supabase.from("players").update({ role: "millionaire" }).eq("id", holder.id);
    await supabase.from("games").update({ million_holder_player_id: holder.id, current_phase: "role_reveal", status: "active" }).eq("id", game.id);
    await supabase.from("million_transfers").insert({ game_id: game.id, from_player_id: null, to_player_id: holder.id, reason: "initial_assignment", public_announced: true });
    await insertNotification(game.id, "You hold The Million", "Protect it. Everyone else wants it.", "player", holder.id);
    await insertNotification(game.id, "Initial Million assigned", `${holder.name} holds The Million.`, "admin");
    await insertPublicEvent(game.id, "million_in_play", "The Million is now in play.", "The hunt begins.", true);
    revalidatePath(`/admin/${game.code}`);
    return { ok: true, data: { holderName: holder.name } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Initial assignment failed." };
  }
}

export async function awardMulanLives(gameCode: string, winnerIds: UUID[]): Promise<ActionResult<{ winners: number }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await supabase.from("players").update({ extra_lives: 0 }).eq("game_id", game.id);
    if (winnerIds.length > 0) {
      await supabase.from("players").update({ extra_lives: 1 }).in("id", winnerIds);
    }
    await insertNotification(game.id, "Extra life awarded", `${winnerIds.length} Mulan winner(s) received one extra life.`, "admin");
    await insertPublicEvent(game.id, "mulan_lives", "Mulan bonus awarded", `${winnerIds.length} player(s) earned an extra life.`, true);
    revalidatePath(`/admin/${game.code}`);
    return { ok: true, data: { winners: winnerIds.length } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Mulan award failed." };
  }
}

export async function moveMillion(gameCode: string, toPlayerId: UUID, reason: MillionTransferReason = "admin_move"): Promise<ActionResult<{ moved: true }>> {
  try {
    await requireAdminSession();
    assertAdminTarget(toPlayerId);
    return await moveMillionInternal(gameCode, toPlayerId, reason);
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Move failed." };
  }
}

async function moveMillionInternal(gameCode: string, toPlayerId: UUID, reason: MillionTransferReason = "admin_move"): Promise<ActionResult<{ moved: true }>> {
  try {
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    const fromPlayerId = game.million_holder_player_id;
    await supabase.from("players").update({ role: "detective" }).eq("game_id", game.id);
    await supabase.from("players").update({ role: "millionaire" }).eq("id", toPlayerId);
    await supabase.from("games").update({ million_holder_player_id: toPlayerId }).eq("id", game.id);
    await supabase.from("million_transfers").insert({ game_id: game.id, from_player_id: fromPlayerId, to_player_id: toPlayerId, reason, public_announced: true });
    if (fromPlayerId) {
      await insertNotification(game.id, "The Million has moved", "You no longer hold The Million.", "player", fromPlayerId);
    }
    await insertNotification(game.id, "You hold The Million", "The Million has moved to you.", "player", toPlayerId);
    await insertNotification(game.id, "Million moved", "The Million holder changed.", "admin");
    await insertPublicEvent(game.id, "million_moved", "The Million has moved.", "No further details are public.", true);
    revalidatePath(`/admin/${game.code}`);
    return { ok: true, data: { moved: true } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Move failed." };
  }
}

export async function fireBazooka(gameCode: string, shooterPlayerId: UUID, targetPlayerId: UUID): Promise<ActionResult<{ correct: boolean; shieldBlocked: boolean }>> {
  try {
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    const sessionPlayer = await requirePlayerSession(game, shooterPlayerId);
    if (game.final_locked) {
      throw new Error("Bazookas are locked.");
    }
    const shooter = sessionPlayer;
    if (shooter.is_eliminated) {
      throw new Error("Eliminated players cannot fire Bazookas.");
    }
    if (!shooter.bazooka_available) {
      throw new Error("Your Bazooka has already been used.");
    }
    if (targetPlayerId === shooterPlayerId) {
      throw new Error("You cannot Bazooka yourself.");
    }
    const targetResult = await supabase.from("players").select("*").eq("id", targetPlayerId).eq("game_id", game.id).single() as DbResult<Player>;
    const target = requireData<Player>(targetResult, "Target not found.") as Player;
    if (target.is_eliminated) {
      throw new Error("That player is already out.");
    }
    const currentHolderId = game.million_holder_player_id;
    const wasCorrect = targetPlayerId === currentHolderId;
    await supabase.from("players").update({ bazooka_available: false }).eq("id", shooterPlayerId);
    await supabase.from("bazooka_shots").insert({ game_id: game.id, shooter_player_id: shooterPlayerId, target_player_id: targetPlayerId, was_correct: wasCorrect, resolved: true });
    await insertNotification(game.id, "Bazooka fired", `${shooter.name} fired a Bazooka.`, "admin");

    let shieldBlocked = false;
    if (wasCorrect && currentHolderId) {
      const holderResult = await supabase.from("players").select("*").eq("id", currentHolderId).single() as DbResult<Player>;
      const holder = requireData<Player>(holderResult, "Holder not found.") as Player;
      if (holder.shield_active) {
        shieldBlocked = true;
        await supabase.from("players").update({ shield_active: false }).eq("id", holder.id);
        await insertNotification(game.id, "Bazooka hit shield", "A correct Bazooka was blocked by a shield.", "admin");
        await insertPublicEvent(game.id, "bazooka_blocked", "A Bazooka hit a shield.", "The Million did not move.", true);
      } else {
        await moveMillionInternal(game.code, shooterPlayerId, "bazooka_success");
        await insertNotification(game.id, "Bazooka hit", "A correct Bazooka moved The Million.", "admin");
      }
    } else {
      await insertNotification(game.id, "Bazooka missed", "A Bazooka was burned forever.", "admin");
      await insertPublicEvent(game.id, "bazooka_fired", "A Bazooka has been fired.", "One Bazooka is gone forever.", true);
    }
    revalidatePath(`/game/${game.code}`);
    return { ok: true, data: { correct: wasCorrect, shieldBlocked } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Bazooka failed." };
  }
}

export async function submitEliminationVote(gameCode: string, voterPlayerId: UUID, targetPlayerId: UUID): Promise<ActionResult<{ votedFor: UUID }>> {
  try {
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await requirePlayerSession(game, voterPlayerId);
    if (game.voting_locked) {
      throw new Error("Voting is locked.");
    }
    if (voterPlayerId === targetPlayerId) {
      throw new Error("You cannot vote for yourself.");
    }
    const playersResult = await supabase
      .from("players")
      .select("*")
      .eq("game_id", game.id)
      .in("id", [voterPlayerId, targetPlayerId]) as DbListResult<Player>;
    const players = requireData<Player[]>(playersResult, "Players not found.") as Player[];
    const voter = players.find((player) => player.id === voterPlayerId);
    const target = players.find((player) => player.id === targetPlayerId);
    if (!voter || !target) {
      throw new Error("Vote target not found.");
    }
    if (voter.is_eliminated) {
      throw new Error("Eliminated players cannot vote.");
    }
    if (target.is_eliminated) {
      throw new Error("That player is already out.");
    }
    const result = await supabase.from("elimination_votes").upsert({
      game_id: game.id,
      day: game.current_day,
      voter_player_id: voterPlayerId,
      target_player_id: targetPlayerId
    }, { onConflict: "game_id,day,voter_player_id" });
    if (result.error) {
      throw new Error(result.error.message);
    }
    await insertNotification(game.id, "Vote submitted", `${voter.name} submitted a vote-off choice.`, "admin");
    revalidatePath(`/admin/${game.code}`);
    return { ok: true, data: { votedFor: targetPlayerId } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Vote failed." };
  }
}

export async function markPlayerSentHome(gameCode: string, playerId: UUID): Promise<ActionResult<{ eliminated: true }>> {
  try {
    await requireAdminSession();
    assertAdminTarget(playerId);
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    const playerResult = await supabase.from("players").select("*").eq("id", playerId).eq("game_id", game.id).single() as DbResult<Player>;
    const player = requireData<Player>(playerResult, "Player not found.") as Player;
    await supabase.from("players").update({ is_eliminated: true }).eq("id", player.id);
    await insertNotification(game.id, "Player sent home", `${player.name} has been marked eliminated.`, "admin");
    await insertPublicEvent(game.id, "player_sent_home", "A player has been sent home.", `${player.name} has left the game.`, true);
    revalidatePath(`/admin/${game.code}`);
    revalidatePath(`/tv/${game.code}`);
    return { ok: true, data: { eliminated: true } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Could not send player home." };
  }
}

export async function setVotingLocked(gameCode: string, locked: boolean): Promise<ActionResult<{ locked: boolean }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await supabase.from("games").update({ voting_locked: locked }).eq("id", game.id);
    await insertNotification(game.id, locked ? "Voting locked" : "Voting opened", locked ? "Vote-off submissions are closed." : "Vote-off submissions are open.", "admin");
    await insertPublicEvent(game.id, locked ? "voting_locked" : "voting_open", locked ? "Voting is locked." : "Voting is open.", locked ? "The narrator has closed vote submissions." : "Submit your vote-off choice now.", true);
    revalidatePath(`/admin/${game.code}`);
    return { ok: true, data: { locked } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Voting lock update failed." };
  }
}

export async function reseedGameContent(gameCode: string): Promise<ActionResult<{ questions: number; challenges: number }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);

    const currentQuestionsResult = await supabase.from("survey_questions").select("*").eq("game_id", game.id) as DbListResult<SurveyQuestion>;
    const currentQuestions = currentQuestionsResult.data ?? [];
    const wantedQuestions = new Set<string>(surveyQuestions);
    const currentQuestionText = new Set(currentQuestions.map((question) => question.question));
    const questionIdsToDelete = currentQuestions.filter((question) => !wantedQuestions.has(question.question)).map((question) => question.id);
    if (questionIdsToDelete.length > 0) {
      await supabase.from("survey_questions").delete().in("id", questionIdsToDelete);
    }
    const questionsToInsert = surveyQuestions.filter((question) => !currentQuestionText.has(question));
    if (questionsToInsert.length > 0) {
      await supabase.from("survey_questions").insert(questionsToInsert.map((question) => ({ game_id: game.id, question, question_type: "text", clue_safe: true })));
    }

    const currentChallengesResult = await supabase.from("millionaire_challenges").select("*").eq("game_id", game.id) as DbListResult<MillionaireChallenge>;
    const currentChallenges = currentChallengesResult.data ?? [];
    const wantedChallengeTitles = new Set(millionaireChallengeLibrary.map((challenge) => challenge.title));
    const currentChallengeTitles = new Set(currentChallenges.map((challenge) => challenge.title));
    const challengeIdsToDeactivate = currentChallenges.filter((challenge) => !wantedChallengeTitles.has(challenge.title)).map((challenge) => challenge.id);
    if (challengeIdsToDeactivate.length > 0) {
      await supabase.from("millionaire_challenges").update({ active: false }).in("id", challengeIdsToDeactivate);
    }
    await Promise.all(millionaireChallengeLibrary.map(async (challenge) => {
      if (currentChallengeTitles.has(challenge.title)) {
        await supabase
          .from("millionaire_challenges")
          .update({ description: challenge.description, difficulty: challenge.difficulty, reward_type: challenge.reward_type, requires_narrator: true, active: true })
          .eq("game_id", game.id)
          .eq("title", challenge.title);
      } else {
        await supabase.from("millionaire_challenges").insert({ ...challenge, game_id: game.id, requires_narrator: true, active: true });
      }
    }));

    await insertNotification(game.id, "Seed content refreshed", "Survey questions and secret challenge library now match src/lib/seed.ts.", "admin");
    revalidatePath(`/admin/${game.code}`);
    return { ok: true, data: { questions: surveyQuestions.length, challenges: millionaireChallengeLibrary.length } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Re-seed failed." };
  }
}

function clueDifficulty(matchCount: number): ClueDifficulty {
  if (matchCount <= 2) {
    return "hard";
  }
  if (matchCount <= 4) {
    return "medium";
  }
  return "soft";
}

function phraseClue(question: string, answer: string): string {
  const value = answer.trim();
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes("mornings or nights")) return `The Millionaire prefers ${value} over the other.`;
  if (lowerQuestion.includes("siblings")) return Number.parseInt(value, 10) > 1 ? "The Millionaire has more than one sibling." : `The Millionaire said they have ${value} sibling(s).`;
  if (lowerQuestion.includes("lying or spotting lies")) return `The Millionaire said they are better at ${value}.`;
  if (lowerQuestion.includes("armory")) return `The Millionaire would rather ${value}.`;
  if (lowerQuestion.includes("countries")) return Number.parseInt(value, 10) > 5 ? "The Millionaire has visited more than 5 countries." : `The Millionaire has visited ${value} countries.`;
  return `The Millionaire answered "${value}" to: ${question}`;
}

export async function generateClueForCurrentMillionaire(gameCode: string): Promise<ActionResult<GeneratedClue>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    if (!game.million_holder_player_id) {
      throw new Error("No Million holder assigned.");
    }
    const answersResult = await supabase
      .from("survey_answers")
      .select("*, survey_questions(*)")
      .eq("game_id", game.id)
      .eq("player_id", game.million_holder_player_id) as DbListResult<{ answer: string; survey_questions: SurveyQuestion }>;
    const holderAnswers = requireData<{ answer: string; survey_questions: SurveyQuestion }[]>(answersResult, "No answers found.") as { answer: string; survey_questions: SurveyQuestion }[];
    const allAnswersResult = await supabase.from("survey_answers").select("*").eq("game_id", game.id) as DbListResult<{ player_id: UUID; question_id: UUID; answer: string }>;
    const allAnswers = requireData<{ player_id: UUID; question_id: UUID; answer: string }[]>(allAnswersResult, "No answers found.") as { player_id: UUID; question_id: UUID; answer: string }[];
    const existingResult = await supabase.from("generated_clues").select("clue_text").eq("game_id", game.id) as DbListResult<{ clue_text: string }>;
    const existing = new Set((existingResult.data ?? []).map((row) => row.clue_text));

    const candidates = holderAnswers
      .map((answer) => {
        const matches = allAnswers.filter((candidate) => candidate.question_id === answer.survey_questions.id && candidate.answer.trim().toLowerCase() === answer.answer.trim().toLowerCase());
        const clueText = phraseClue(answer.survey_questions.question, answer.answer);
        return { clueText, matchCount: new Set(matches.map((match) => match.player_id)).size };
      })
      .filter((candidate) => !existing.has(candidate.clueText))
      .filter((candidate) => candidate.matchCount > 1 || game.current_day >= 3 || game.current_phase === "final_lock")
      .filter((candidate) => candidate.matchCount < 10)
      .sort((a, b) => {
        const aPreferred = a.matchCount >= 2 && a.matchCount <= 5 ? 0 : 1;
        const bPreferred = b.matchCount >= 2 && b.matchCount <= 5 ? 0 : 1;
        return aPreferred - bPreferred || Math.abs(a.matchCount - 3) - Math.abs(b.matchCount - 3);
      });

    const selected = candidates[0] ?? {
      clueText: "The Millionaire has not used their Bazooka.",
      matchCount: 10
    };
    const inserted = await supabase
      .from("generated_clues")
      .insert({
        game_id: game.id,
        day: game.current_day,
        generated_for_player_id: game.million_holder_player_id,
        source_type: "survey" satisfies ClueSourceType,
        clue_text: selected.clueText,
        difficulty: clueDifficulty(selected.matchCount),
        matching_player_count: selected.matchCount
      })
      .select("*")
      .single() as DbResult<GeneratedClue>;
    const clue = requireData<GeneratedClue>(inserted, "Could not generate clue.") as GeneratedClue;
    await insertNotification(game.id, "Clue generated", clue.clue_text, "admin");
    revalidatePath(`/admin/${game.code}/clues`);
    return { ok: true, data: clue };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Clue generation failed." };
  }
}

export async function assignClueToArmoryEntrant(gameCode: string, clueId: UUID, playerId: UUID): Promise<ActionResult<{ assigned: true }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await supabase.from("generated_clues").update({ recipient_player_id: playerId, released: true }).eq("id", clueId).eq("game_id", game.id);
    await insertNotification(game.id, "Private Armory clue", "A clue has been assigned to you. You may tell the truth or lie.", "player", playerId);
    await insertNotification(game.id, "Clue ready to present", "An Armory clue was assigned privately.", "admin");
    revalidatePath(`/admin/${game.code}/armory`);
    return { ok: true, data: { assigned: true } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Assign clue failed." };
  }
}

export async function releasePublicClue(gameCode: string, clueId: UUID): Promise<ActionResult<{ released: true }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    const clueResult = await supabase.from("generated_clues").select("*").eq("id", clueId).eq("game_id", game.id).single() as DbResult<GeneratedClue>;
    const clue = requireData<GeneratedClue>(clueResult, "Clue not found.") as GeneratedClue;
    await supabase.from("generated_clues").update({ released: true }).eq("id", clue.id);
    await insertPublicEvent(game.id, "public_clue", "A clue has dropped.", clue.clue_text, true);
    await insertNotification(game.id, "Public clue released", clue.clue_text, "admin");
    revalidatePath(`/tv/${game.code}`);
    return { ok: true, data: { released: true } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Release clue failed." };
  }
}

export async function createPublicAlert(gameCode: string, title: string, message: string): Promise<ActionResult<{ created: true }>> {
  try {
    await requireAdminSession();
    const game = await getGameByCode(gameCode);
    await insertPublicEvent(game.id, "admin_alert", title, message, true);
    await insertNotification(game.id, "Public event created", title, "admin");
    revalidatePath(`/admin/${game.code}/events`);
    return { ok: true, data: { created: true } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Public alert failed." };
  }
}

export async function randomizeTeams(gameCode: string): Promise<ActionResult<{ teams: number }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    const playersResult = await supabase.from("players").select("*").eq("game_id", game.id).eq("is_eliminated", false) as DbListResult<Player>;
    const players = requireData<Player[]>(playersResult, "No players found.") as Player[];
    const teamNames = ["Team Gold", "Team Lagoon"];
    await supabase.from("teams").delete().eq("game_id", game.id).eq("day", game.current_day);
    const teamsResult = await supabase.from("teams").insert(teamNames.map((name) => ({ game_id: game.id, day: game.current_day, name }))).select("*") as DbListResult<Team>;
    const teams = requireData<Team[]>(teamsResult, "Could not create teams.") as Team[];
    const shuffled = [...players].sort(() => Math.random() - 0.5);
    await Promise.all(shuffled.map((player, index) => supabase.from("players").update({ current_team_id: teams[index % teams.length].id }).eq("id", player.id)));
    await insertPublicEvent(game.id, "teams_randomized", "Teams are set.", "Today's teams are live.", true);
    revalidatePath(`/admin/${game.code}/teams`);
    return { ok: true, data: { teams: teams.length } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Team randomize failed." };
  }
}

export async function selectArmoryEntrant(gameCode: string, playerId: UUID): Promise<ActionResult<{ selected: true }>> {
  try {
    await requireAdminSession();
    assertAdminTarget(playerId);
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await supabase.from("armory_entries").upsert({ game_id: game.id, day: game.current_day, player_id: playerId }, { onConflict: "game_id,day,player_id" });
    await insertNotification(game.id, "Armory access", "You have been selected to enter the Armory.", "player", playerId);
    await insertNotification(game.id, "Armory entrant selected", "A player is waiting for an Armory reward.", "admin");
    await insertPublicEvent(game.id, "armory_selected", "The Armory is open.", "One player has entered the Armory.", true);
    revalidatePath(`/admin/${game.code}/armory`);
    return { ok: true, data: { selected: true } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Armory selection failed." };
  }
}

export async function selectArmoryReward(gameCode: string, playerId: UUID, reward: ArmoryRewardType): Promise<ActionResult<{ reward: ArmoryRewardType }>> {
  try {
    await requireAdminSession();
    assertAdminTarget(playerId);
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await supabase.from("armory_entries").update({ selected_reward: reward }).eq("game_id", game.id).eq("player_id", playerId).eq("day", game.current_day);
    if (reward === "shield" || reward === "restore_life") {
      const update = reward === "shield" ? { shield_active: true } : { extra_lives: 1 };
      await supabase.from("players").update(update).eq("id", playerId);
    }
    await insertNotification(game.id, "Armory reward selected", `Reward selected: ${reward}. Manual rewards can be narrated publicly or kept private.`, "admin");
    revalidatePath(`/game/${game.code}/armory`);
    return { ok: true, data: { reward } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Reward selection failed." };
  }
}

export async function assignMillionaireChallenge(gameCode: string): Promise<ActionResult<{ title: string }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    if (!game.million_holder_player_id) {
      throw new Error("No Million holder assigned.");
    }
    const challengesResult = await supabase.from("millionaire_challenges").select("*").eq("game_id", game.id).eq("active", true) as DbListResult<MillionaireChallenge>;
    const challenges = requireData<MillionaireChallenge[]>(challengesResult, "No challenges found.") as MillionaireChallenge[];
    const challenge = challenges[Math.floor(Math.random() * challenges.length)];
    await supabase.from("millionaire_challenge_assignments").insert({
      game_id: game.id,
      challenge_id: challenge.id,
      day: game.current_day,
      millionaire_player_id: game.million_holder_player_id
    });
    await insertNotification(game.id, "Secret challenge assigned", `${challenge.title}: ${challenge.description}`, "player", game.million_holder_player_id);
    await insertNotification(game.id, "Millionaire challenge assigned", challenge.title, "admin");
    revalidatePath(`/admin/${game.code}/challenges`);
    return { ok: true, data: { title: challenge.title } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Challenge assignment failed." };
  }
}

export async function submitMillionaireChallengeAttempt(gameCode: string, assignmentId: UUID, playerId: UUID): Promise<ActionResult<{ attempted: true }>> {
  try {
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await requirePlayerSession(game, playerId);
    await supabase.from("millionaire_challenge_assignments").update({ status: "attempted" }).eq("id", assignmentId).eq("millionaire_player_id", playerId);
    await insertNotification(game.id, "Millionaire challenge attempted", "Narrator confirmation is required.", "admin");
    revalidatePath(`/admin/${game.code}/challenges`);
    return { ok: true, data: { attempted: true } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Attempt failed." };
  }
}

async function randomActivePlayer(gameId: UUID, excludedPlayerIds: UUID[] = []) {
  const supabase = createServiceClient();
  const result = await supabase
    .from("players")
    .select("*")
    .eq("game_id", gameId)
    .eq("is_eliminated", false) as DbListResult<Player>;
  const players = (result.data ?? []).filter((player) => !excludedPlayerIds.includes(player.id));
  return players[Math.floor(Math.random() * players.length)] ?? null;
}

function rewardNeedsTarget(reward: string) {
  return reward.includes("move_million") || reward.includes("steal_life") || reward === "block_bazooka";
}

async function applyMillionaireReward(game: Game, assignment: MillionaireChallengeAssignment & { millionaire_challenges: MillionaireChallenge }, targetPlayerId: UUID | null) {
  const supabase = createServiceClient();
  const reward = assignment.millionaire_challenges.reward_type;
  const millionaireId = assignment.millionaire_player_id;
  const notes: string[] = [];

  if (rewardNeedsTarget(reward) && !targetPlayerId) {
    throw new Error("Select a reward target before confirming this challenge.");
  }
  const rewardTarget = targetPlayerId
    ? requireData<Player>(await supabase.from("players").select("*").eq("game_id", game.id).eq("id", targetPlayerId).single() as DbResult<Player>, "Reward target not found.") as Player
    : null;
  if (rewardTarget?.is_eliminated) {
    throw new Error("Reward target is already out.");
  }
  if (reward === "block_bazooka" && rewardTarget?.id === millionaireId) {
    throw new Error("Block Bazooka needs a target other than the Millionaire.");
  }
  if (reward.includes("steal_life")) {
    if (!rewardTarget || rewardTarget.id === millionaireId || rewardTarget.extra_lives <= 0) {
      throw new Error("Steal life needs a different target who has an extra life.");
    }
  }

  if (reward.includes("shield") || reward === "double_bazooka_protection") {
    await supabase.from("players").update({ shield_active: true }).eq("id", millionaireId);
    notes.push(reward === "double_bazooka_protection" ? "Shield activated as double Bazooka protection." : "Shield activated.");
  }

  if (reward.includes("move_million")) {
    const target = rewardTarget ?? await randomActivePlayer(game.id, [millionaireId]);
    if (target) {
      await moveMillionInternal(game.code, target.id, "secret_challenge_reward");
      notes.push(`The Million moved to ${target.name}.`);
    }
  }

  if (reward.includes("steal_life")) {
    const victim = rewardTarget;
    if (victim) {
      const millionaireResult = await supabase.from("players").select("*").eq("id", millionaireId).single() as DbResult<Player>;
      const millionaire = requireData<Player>(millionaireResult, "Millionaire not found.") as Player;
      await supabase.from("players").update({ extra_lives: Math.max(0, victim.extra_lives - 1) }).eq("id", victim.id);
      await supabase.from("players").update({ extra_lives: millionaire.extra_lives + 1 }).eq("id", millionaire.id);
      await insertNotification(game.id, "Player lost life", `${victim.name} lost one life to a secret challenge reward.`, "admin");
      notes.push(`Stole one life from ${victim.name}.`);
    } else {
      notes.push("Steal life reward had no valid target with an extra life.");
    }
  }

  if (reward === "block_bazooka") {
    const target = rewardTarget;
    if (target) {
      await supabase.from("players").update({ bazooka_available: false }).eq("id", target.id);
      await insertNotification(game.id, "Bazooka blocked", "Your Bazooka has been blocked by a secret reward.", "player", target.id);
      notes.push(`${target.name}'s Bazooka was blocked.`);
    }
  }

  if (reward.includes("scramble_clue")) {
    await supabase.from("generated_clues").insert({
      game_id: game.id,
      day: game.current_day,
      generated_for_player_id: millionaireId,
      source_type: "status" satisfies ClueSourceType,
      clue_text: "The Millionaire has scrambled the clue trail. Treat the next clue with suspicion.",
      difficulty: "soft" satisfies ClueDifficulty,
      matching_player_count: 6,
      released: false
    });
    await insertNotification(game.id, "Clue scrambled", "A soft scramble clue was created for admin release or discard.", "admin");
    notes.push("Scramble clue created.");
  }

  if (reward === "choose_next_teams") {
    await insertNotification(game.id, "Team influence earned", "Let the Millionaire influence the next team assignment before randomizing.", "admin");
    notes.push("Admin notified to allow team influence.");
  }

  return notes;
}

export async function confirmMillionaireChallenge(gameCode: string, assignmentId: UUID, success: boolean, rewardTargetPlayerId?: UUID): Promise<ActionResult<{ success: boolean }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    const assignmentResult = await supabase
      .from("millionaire_challenge_assignments")
      .select("*, millionaire_challenges(*)")
      .eq("id", assignmentId)
      .single() as DbResult<MillionaireChallengeAssignment & { millionaire_challenges: MillionaireChallenge }>;
    const assignment = requireData<MillionaireChallengeAssignment & { millionaire_challenges: MillionaireChallenge }>(assignmentResult, "Assignment not found.") as MillionaireChallengeAssignment & { millionaire_challenges: MillionaireChallenge };
    if (assignment.game_id !== game.id) {
      throw new Error("Challenge assignment does not belong to this game.");
    }
    if (assignment.reward_applied) {
      throw new Error("This reward has already been applied.");
    }
    if (success) {
      const appliedNotes = await applyMillionaireReward(game, assignment, rewardTargetPlayerId ?? null);
      await supabase.from("millionaire_challenge_assignments").update({
        status: "confirmed",
        narrator_confirmed: true,
        reward_applied: true,
        completed_at: new Date().toISOString()
      }).eq("id", assignmentId);
      await insertNotification(game.id, "Reward applied", appliedNotes.join(" ") || "Secret challenge reward applied.", "admin");
      await insertPublicEvent(game.id, "secret_challenge_complete", "A secret challenge has been completed.", "The villa just shifted.", true);
    } else {
      await supabase.from("millionaire_challenge_assignments").update({
        status: "rejected",
        narrator_confirmed: false,
        completed_at: null
      }).eq("id", assignmentId);
    }
    await insertNotification(game.id, success ? "Challenge confirmed" : "Challenge rejected", assignment.millionaire_challenges.title, "admin");
    revalidatePath(`/admin/${game.code}/challenges`);
    return { ok: true, data: { success } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Confirmation failed." };
  }
}

export async function finalLock(gameCode: string): Promise<ActionResult<{ locked: true }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await supabase.from("games").update({ final_locked: true, current_phase: "final_lock", status: "locked" }).eq("id", game.id);
    await insertNotification(game.id, "Final lock started", "Bazookas and Million movement are locked unless admin overrides.", "admin");
    await insertPublicEvent(game.id, "final_lock", "Final lock has started.", "No more hiding. Final reveal is coming.", true);
    revalidatePath(`/admin/${game.code}/final`);
    return { ok: true, data: { locked: true } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Final lock failed." };
  }
}

export async function finalReveal(gameCode: string): Promise<ActionResult<{ revealed: true }>> {
  try {
    await requireAdminSession();
    const supabase = createServiceClient();
    const game = await getGameByCode(gameCode);
    await supabase.from("games").update({ current_phase: "final_reveal", status: "complete" }).eq("id", game.id);
    await insertPublicEvent(game.id, "final_reveal", "Final reveal", "The Secret Millionaire is revealed. Winner gets free dinner.", true);
    revalidatePath(`/tv/${game.code}`);
    return { ok: true, data: { revealed: true } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Final reveal failed." };
  }
}

export async function getAdminSnapshot(gameCode: string): Promise<AdminSnapshot> {
  await requireAdminSession();
  const supabase = createServiceClient();
  const game = await getGameByCode(gameCode);
  const [players, teams, clues, events, notifications, challenges, assignments, eliminationVotes] = await Promise.all([
    supabase.from("players").select("*").eq("game_id", game.id).order("joined_at") as unknown as Promise<DbListResult<Player>>,
    supabase.from("teams").select("*").eq("game_id", game.id).order("created_at") as unknown as Promise<DbListResult<Team>>,
    supabase.from("generated_clues").select("*").eq("game_id", game.id).order("created_at", { ascending: false }) as unknown as Promise<DbListResult<GeneratedClue>>,
    supabase.from("public_events").select("*").eq("game_id", game.id).order("created_at", { ascending: false }).limit(30) as unknown as Promise<DbListResult<PublicEvent>>,
    supabase.from("notifications").select("*").eq("game_id", game.id).eq("audience", "admin").order("created_at", { ascending: false }).limit(25) as unknown as Promise<DbListResult<Notification>>,
    supabase.from("millionaire_challenges").select("*").eq("game_id", game.id).order("difficulty") as unknown as Promise<DbListResult<MillionaireChallenge>>,
    supabase.from("millionaire_challenge_assignments").select("*").eq("game_id", game.id).order("created_at", { ascending: false }) as unknown as Promise<DbListResult<MillionaireChallengeAssignment>>,
    supabase.from("elimination_votes").select("*").eq("game_id", game.id).eq("day", game.current_day).order("created_at", { ascending: false }) as unknown as Promise<DbListResult<EliminationVote>>
  ]);
  const playerRows = players.data ?? [];
  const voteRows = eliminationVotes.data ?? [];
  const eliminationTallies = buildEliminationTallies(playerRows, voteRows);
  return {
    game,
    players: playerRows,
    teams: teams.data ?? [],
    clues: clues.data ?? [],
    events: events.data ?? [],
    notifications: notifications.data ?? [],
    challenges: challenges.data ?? [],
    assignments: assignments.data ?? [],
    eliminationVotes: voteRows,
    eliminationTallies,
    sentHomeCandidates: eliminationTallies.filter((tally) => tally.tiedForLead)
  };
}

function buildEliminationTallies(players: Player[], votes: EliminationVote[]): EliminationTally[] {
  const counts = new Map<UUID, number>();
  for (const vote of votes) {
    counts.set(vote.target_player_id, (counts.get(vote.target_player_id) ?? 0) + 1);
  }
  const tallies = players
    .map((player) => ({
      playerId: player.id,
      playerName: player.name,
      avatarEmoji: player.avatar_emoji,
      votes: counts.get(player.id) ?? 0,
      isEliminated: player.is_eliminated,
      tiedForLead: false
    }))
    .filter((tally) => tally.votes > 0)
    .sort((left, right) => right.votes - left.votes || left.playerName.localeCompare(right.playerName));
  const leadVotes = tallies[0]?.votes ?? 0;
  return tallies.map((tally) => ({ ...tally, tiedForLead: tally.votes === leadVotes }));
}

export async function getPlayerSnapshot(gameCode: string, playerId: UUID): Promise<PlayerSnapshot> {
  const supabase = createServiceClient();
  const game = await getGameByCode(gameCode);
  const sessionPlayer = await requirePlayerSession(game, playerId);
  const [playerResult, playersResult, teamsResult, publicCluesResult, privateCluesResult, eventsResult, assignmentsResult, eliminationVoteResult] = await Promise.all([
    supabase.from("players").select("*").eq("id", playerId).eq("game_id", game.id).single() as unknown as Promise<DbResult<Player>>,
    supabase.from("players").select("*").eq("game_id", game.id).order("joined_at") as unknown as Promise<DbListResult<Player>>,
    supabase.from("teams").select("*").eq("game_id", game.id).order("created_at") as unknown as Promise<DbListResult<Team>>,
    supabase.from("generated_clues").select("*").eq("game_id", game.id).eq("released", true).is("recipient_player_id", null).order("created_at", { ascending: false }) as unknown as Promise<DbListResult<GeneratedClue>>,
    supabase.from("generated_clues").select("*").eq("game_id", game.id).eq("recipient_player_id", playerId).order("created_at", { ascending: false }) as unknown as Promise<DbListResult<GeneratedClue>>,
    supabase.from("public_events").select("*").eq("game_id", game.id).eq("show_on_tv", true).order("created_at", { ascending: false }).limit(20) as unknown as Promise<DbListResult<PublicEvent>>,
    supabase.from("millionaire_challenge_assignments").select("*, millionaire_challenges(*)").eq("game_id", game.id).eq("millionaire_player_id", playerId).order("created_at", { ascending: false }).limit(1) as unknown as Promise<DbListResult<MillionaireChallengeAssignment & { millionaire_challenges: MillionaireChallenge }>>,
    supabase.from("elimination_votes").select("*").eq("game_id", game.id).eq("day", game.current_day).eq("voter_player_id", playerId).maybeSingle() as unknown as Promise<DbResult<EliminationVote>>
  ]);
  const player = requireData<Player>(playerResult, "Player not found.") as Player;
  if (player.id !== sessionPlayer.id) {
    throw new Error("Player session expired. Log in again.");
  }
  const assignment = assignmentsResult.data?.[0];
  return {
    game: publicGame(game),
    player: playerSelf(player),
    players: (playersResult.data ?? []).map(publicPlayer),
    teams: teamsResult.data ?? [],
    publicClues: (publicCluesResult.data ?? []).map(safeClue),
    privateClues: (privateCluesResult.data ?? []).map(safeClue),
    events: eventsResult.data ?? [],
    activeChallenge: assignment ? { ...assignment, challenge: assignment.millionaire_challenges } : null,
    eliminationVote: eliminationVoteResult.data ?? null
  };
}

export async function getTvSnapshot(gameCode: string): Promise<TvSnapshot> {
  const supabase = createServiceClient();
  const game = await getGameByCode(gameCode);
  const [playersResult, teamsResult, cluesResult, eventsResult] = await Promise.all([
    supabase.from("players").select("*").eq("game_id", game.id).order("joined_at") as unknown as Promise<DbListResult<Player>>,
    supabase.from("teams").select("*").eq("game_id", game.id).order("created_at") as unknown as Promise<DbListResult<Team>>,
    supabase.from("generated_clues").select("*").eq("game_id", game.id).eq("released", true).is("recipient_player_id", null).order("created_at", { ascending: false }) as unknown as Promise<DbListResult<GeneratedClue>>,
    supabase.from("public_events").select("*").eq("game_id", game.id).eq("show_on_tv", true).order("created_at", { ascending: false }).limit(30) as unknown as Promise<DbListResult<PublicEvent>>
  ]);
  return {
    game: publicGame(game),
    players: (playersResult.data ?? []).map(publicPlayer),
    teams: teamsResult.data ?? [],
    publicClues: (cluesResult.data ?? []).map(safeClue),
    events: eventsResult.data ?? []
  };
}

export async function getSurveyQuestions(gameCode: string): Promise<{ game: PublicGame; questions: SurveyQuestion[] }> {
  const supabase = createServiceClient();
  const game = await getGameByCode(gameCode);
  const questionsResult = await supabase.from("survey_questions").select("*").eq("game_id", game.id).order("created_at") as DbListResult<SurveyQuestion>;
  return { game: publicGame(game), questions: questionsResult.data ?? [] };
}
