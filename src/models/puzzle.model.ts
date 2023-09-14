import { OpenAI } from "openai";
import dotenv from "dotenv";
dotenv.config();

import prompts from "../prompts.json";
import { ChatCompletionCreateParams, ChatCompletionMessageParam } from "openai/resources/chat";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_SECRET,
});

namespace puzzles {
  type PuzzleId = number;
  interface Puzzle {
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

  export const getPuzzle = async (puzzleId: PuzzleId): Promise<Puzzle | null> => prompts.puzzles.find(p => p.id === puzzleId) || null;

  export const getAllPuzzles = async (): Promise<Puzzle[]> => prompts.puzzles;

  export const makeGuess = async (puzzle: Puzzle, guess: string): Promise<QueryResult> => {

    const resp = await openai.chat.completions.create({
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
      const terminationResp = await openai.chat.completions.create({
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

export default puzzles;
