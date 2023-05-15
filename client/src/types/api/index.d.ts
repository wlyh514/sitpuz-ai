
declare module "api" {
  export type PuzzleId = number; 

  export interface Puzzle {
    id: PuzzleId;
    lead: string;
  }

  export interface Guess {
    content: string;
    result: 0 | 1 | 2 | 4 | 500 | -1;
  }

  export interface GetAllPuzzleRespBody {
    puzzles: { id: PuzzleId, lead: string }[];
  }

  export interface MakeGuessRespBody {
    guess: Guess;
    story?: string;
  }
}