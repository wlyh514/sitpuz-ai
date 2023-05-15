import { GetAllPuzzleRespBody, Guess, MakeGuessRespBody, PuzzleId } from "api";

export enum QueryResult {
  TRUE = 0,
  FALSE = 1,
  UNRELATED = 2, 
  GAMEOVER = 4,
  ERROR = 500, 
  PENDING = -1,
}

export const getAllPuzzles = async (): Promise<GetAllPuzzleRespBody> => {
  const resp = await fetch(`${process.env.REACT_APP_API_HOST}/api/v1/puzzles`);
  if (resp.ok) {
    return await resp.json();
  }
  throw new Error("Internal Server Error");
}

export const makeGuess = async (puzzleId: PuzzleId, content: string): Promise<MakeGuessRespBody> => {
  const resp = await fetch(`${process.env.REACT_APP_API_HOST}/api/v1/puzzles/${puzzleId}/guess`, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({content}),
  });
  if (resp.ok) {

    const respBody: MakeGuessRespBody = await resp.json();
    const newGuess = respBody.guess;

    const guesses = await getGuessesOfPuzzle(puzzleId);
    localStorage.setItem(`p-${puzzleId}-guesses`, JSON.stringify([...guesses, newGuess]));
    if (respBody.story) {
      localStorage.setItem(`p-${puzzleId}-story`, respBody.story);
    }
    return respBody;
  }
  throw new Error("Internal Server Error");
}

export const getGuessesOfPuzzle = async (puzzleId: PuzzleId): Promise<Guess[]> => {
  const raw = localStorage.getItem(`p-${puzzleId}-guesses`);
  if (!raw) {
    return []; 
  }
  return JSON.parse(raw);
}

export const getStoryOfPuzzle = async (puzzleId: PuzzleId): Promise<string | null> => {
  return localStorage.getItem(`p-${puzzleId}-story`);
}

export const clearPuzzle = async (puzzleId: PuzzleId) => {
  localStorage.removeItem(`p-${puzzleId}-guesses`);
  localStorage.removeItem(`p-${puzzleId}-story`);
}
