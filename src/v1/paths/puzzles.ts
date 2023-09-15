import { OperationFunction } from "express-openapi";
import PuzzleService from "../services/puzzle.service.js";
import { GetAllPuzzleRespBody } from "api";

export default function (puzzleService: PuzzleService) {
    const get: OperationFunction = async (req, res) => {
        const puzzles = await puzzleService.getAllPuzzles();
        res.json({ puzzles } as GetAllPuzzleRespBody);
    }

    get.apiDoc = {
        operationId: "getPuzzles",
        summary: "Get all puzzles of a specific language",
        parameters: [
            {
                in: "query",
                name: "lang",
                required: false,
            }
        ],
        responses: {
            200: {
                description: "List of puzzles",
                content: {
                    "application/json": {
                        schema: {
                            type: "array", 
                            items: {
                                $ref: "#/components/schemas/Puzzle",
                            },
                        }
                    }
                }
            }
        }
    }

    const operations = { get };
    return operations;
}; 