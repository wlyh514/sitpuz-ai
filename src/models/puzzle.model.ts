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
    IRRELEVANT = 2,
    GAMEOVER = 4,
    ERROR = 500,
  }

  export const getPuzzle = async (puzzleId: PuzzleId): Promise<Puzzle | null> => prompts.puzzles.find(p => p.id === puzzleId) || null;

  export const getAllPuzzles = async (): Promise<Puzzle[]> => prompts.puzzles;

  export const makeGuess = async (puzzle: Puzzle, guess: string): Promise<QueryResult> => {

    const resp = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        ...prompts.starter as ChatCompletionMessageParam[],
        {
          role: "user",
          content: `Narrative: ${puzzle.story}\nStatement: ${guess}`
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
      case 'IRRELEVANT':
        result = QueryResult.IRRELEVANT; break;
      default:
        result = QueryResult.ERROR;
    }
    if (result === QueryResult.TRUE) {
      const terminationResp = await openai.chat.completions.create({
        messages: [
          ...prompts.termination_starter as ChatCompletionMessageParam[],
          {
            role: "user",
            content: `Narrative：${puzzle.story}\nStatement：${guess}`
          }
        ],
        model: "gpt-4",
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
