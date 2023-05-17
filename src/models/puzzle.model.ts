import {ChatCompletionRequestMessage, Configuration, OpenAIApi} from "openai";
import dotenv from "dotenv";
dotenv.config();

import prompts from "../prompts.json";

const opanAiConfig = new Configuration({
  apiKey: process.env.OPENAI_SECRET,
});
const openai = new OpenAIApi(opanAiConfig)

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
    const resp = await openai.createChatCompletion({
      messages: [
        ...prompts.starter as ChatCompletionRequestMessage[],
        {
          role: "user", 
          content: `故事：${puzzle.story}\n陈述：${guess}`
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: 0.2,
      presence_penalty: 0,
      frequency_penalty: 0,
    });
    let result = QueryResult.ERROR; 
    console.log(resp.data.choices[0].message?.content)
    
    switch (resp.data.choices[0].message?.content) {
      case '0': 
        result = QueryResult.TRUE; break;
      case '1': 
        result = QueryResult.FALSE; break;
      case '2': 
        result = QueryResult.UNRELATED; break;
      default:
        result = QueryResult.ERROR;
    }
    if (result === QueryResult.TRUE) {
      const terminationResp = await openai.createChatCompletion({
        messages: [
          ...prompts.termination_starter as ChatCompletionRequestMessage[],
          {
            role: "user", 
            content: `故事：${puzzle.story}\n陈述：${guess}`
          }
        ],
        model: "gpt-3.5-turbo",
        temperature: 0.2,
        presence_penalty: 0,
        frequency_penalty: 0,
      });
      if (terminationResp.data.choices[0]?.message?.content === "1") {
        return QueryResult.GAMEOVER;
      }
    }
    return result;
  }
}

export default puzzles;