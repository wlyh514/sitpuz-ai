import express from "express";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { initialize } from "express-openapi";
import { fileURLToPath } from "url";
import path from "path";
import OpenAI from "openai";

import apiDoc from "./v1/api-doc.js";
import PuzzleService from "./v1/services/puzzle.service.js";


const PORT = Number(process.env.PORT) || 5000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors({
  origin: process.env.HOST,
}));

// const api = express.Router();

/* Resources */
const openAI = new OpenAI({ apiKey: process.env.OPENAI_SECRET });
const prisma = new PrismaClient();

/* Services */
const puzzleService = new PuzzleService(openAI, prisma);

// const puzzlesController = express.Router();

// puzzlesController.get("/", async (_, res) => {
//   return res.json({
//     puzzles: (await puzzles.getAllPuzzles()).map(p => ({ id: p.id, lead: p.lead }))
//   } as GetAllPuzzleRespBody);
// });

// puzzlesController.post("/:puzzleId/guess", async (req, res) => {
//   const puzzleId = Number(req.params.puzzleId);
//   if (isNaN(puzzleId)) {
//     res.status(422).end();
//     return;
//   }

//   const { content } = req.body;
//   if (typeof content !== "string" || content.length === 0) {
//     res.status(422).end();
//     return;
//   }

//   const puzzle = await puzzles.getPuzzle(puzzleId);
//   if (!puzzle) {
//     res.status(404).end();
//     return;
//   }

//   try {
//     const result = await puzzles.makeGuess(puzzle, content);
//     res.json({
//       guess: {
//         content,
//         result,
//       },
//       story: result === puzzles.QueryResult.GAMEOVER ? puzzle.story : undefined
//     } as MakeGuessRespBody);
//   } catch (e) {
//     console.error(e)
//     res.json({
//       guess: {
//         content,
//         result: 500,
//       }
//     } as MakeGuessRespBody);
//   }
// });

app.on("close", () => {
  console.log("server closed");
  prisma.$disconnect();
});

const framework = await initialize({
  app,
  apiDoc: apiDoc,
  paths: path.resolve(__dirname, "v1", "paths"),
  dependencies: {
    puzzleService,
  },
  exposeApiDocs: true,
});

console.log(JSON.stringify(framework.apiDoc))

app.listen(PORT, () => {
  console.log(`sitpuz-ai running on port ${PORT}`);
});

