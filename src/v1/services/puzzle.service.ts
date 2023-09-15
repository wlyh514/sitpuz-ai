import { OpenAI } from "openai";

import prompts from "../../prompts.js";
import { ChatCompletionMessageParam } from "openai/resources/chat/index";
import { PrismaClient } from "@prisma/client";


export type PuzzleId = number;
export interface Puzzle {
  id: PuzzleId,
  story: string;
  lead: string;
}
export enum QueryResult {
  TRUE = 0,
  FALSE = 1,
  UNRELATED = 2,
  GAMEOVER = 4,
  ERROR = 500,
}

class PuzzleService {
  constructor(
    private openAI: OpenAI,
    private prisma: PrismaClient,
  ) { }

  async getPuzzle(puzzleId: PuzzleId): Promise<Puzzle | null> {
    return prompts.puzzles.find(p => p.id === puzzleId) || null;
  }

  async getAllPuzzles(): Promise<Puzzle[]> {
    return prompts.puzzles;
  }

  async makeGuess(puzzle: Puzzle, guess: string): Promise<QueryResult> {

    const resp = await this.openAI.chat.completions.create({
      model: "gpt-4-0613",
      messages: [
        ...prompts.starter as ChatCompletionMessageParam[],
        {
          role: "user",
          content: `故事：${puzzle.story}\n陈述：${guess}`
        }
      ],
      temperature: 0,
      presence_penalty: 0,
      frequency_penalty: 0,
    });
    let result = QueryResult.ERROR;

    // console.log(resp.choices[0].message?.content);

    switch (resp.choices[0].message?.content) {
      case 'TRUE':
        result = QueryResult.TRUE; break;
      case 'FALSE':
        result = QueryResult.FALSE; break;
      case 'UNRELATED':
        result = QueryResult.UNRELATED; break;
      default:
        result = QueryResult.ERROR;
    }
    if (result === QueryResult.TRUE) {
      const terminationResp = await this.openAI.chat.completions.create({
        messages: [
          ...prompts.termination_starter as ChatCompletionMessageParam[],
          {
            role: "user",
            content: `故事：${puzzle.story}\n陈述：${guess}`
          }
        ],
        model: "gpt-4-0613",
        temperature: 0,
        presence_penalty: 0,
        frequency_penalty: 0,
      });

      // console.log(terminationResp.choices[0]?.message?.content);

      if (terminationResp.choices[0]?.message?.content?.includes("TRUE")) {
        return QueryResult.GAMEOVER;
      }
    }
    return result;
  }
}

export default PuzzleService;
