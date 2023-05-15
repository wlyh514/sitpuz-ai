import express from "express";
import puzzles from "./models/puzzle.model";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

import { GetAllPuzzleRespBody, MakeGuessRespBody } from 'api';

const PORT = process.env.PORT || 5000;

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.HOST,
}));

const api = express.Router();
const puzzlesController = express.Router();

puzzlesController.get("/", async (_, res) => {
  return res.json({
    puzzles: (await puzzles.getAllPuzzles()).map(p => ({id: p.id, lead: p.lead}))
  } as GetAllPuzzleRespBody);
});

puzzlesController.post("/:puzzleId/guess", async (req, res) => {
  const puzzleId = Number(req.params.puzzleId);
  if (isNaN(puzzleId)) {
    res.status(422).end();
    return;
  }

  const { content } = req.body;
  if (typeof content !== "string" || content.length === 0) {
    res.status(422).end();
    return;
  }

  const puzzle = await puzzles.getPuzzle(puzzleId);
  if (!puzzle) {
    res.status(404).end();
    return;
  }

  try {
    const result = await puzzles.makeGuess(puzzle, content); 
    res.json({
      guess: {
        content, 
        result,
      },
      story: result === puzzles.QueryResult.GAMEOVER ? puzzle.story : undefined
    } as MakeGuessRespBody);
  } catch (e) {
    res.json({
      guess: {
        content,
        result: 500,
      }
    } as MakeGuessRespBody);
  }
});

api.use("/puzzles", puzzlesController);
app.use("/api/v1", api);

app.listen(PORT, () => {
  console.log(`sitpuz-ai running on port ${PORT}`);
});
