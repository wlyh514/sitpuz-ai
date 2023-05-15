import { Guess } from "api";
import React from "react";
import "./Guess.css";
import { QueryResult } from "../model";

interface Props {
  guess: Guess
}

const resultToColor: Record<QueryResult, string> = {
  [QueryResult.TRUE]: "#4caf50",
  [QueryResult.FALSE]: "#f44336",
  [QueryResult.UNRELATED]: "#2196f3",
  [QueryResult.GAMEOVER]: "gold",
  [QueryResult.ERROR]: "#ff5722",
  [QueryResult.PENDING]: "gray",
}

const resultToIcon: Record<QueryResult, string> = {
  [QueryResult.TRUE]: "✔",
  [QueryResult.FALSE]: "✗",
  [QueryResult.UNRELATED]: "○",
  [QueryResult.GAMEOVER]: "👑",
  [QueryResult.ERROR]: "⚠",
  [QueryResult.PENDING]: "🤖",
}

const GuessDisplay: React.FC<Props> = ({guess}) => {
  return (
    <div className="guess-display">
      <div 
        className="result-label" 
        style={{backgroundColor: resultToColor[guess.result]}}
      >
        <span className={guess.result === QueryResult.PENDING ? "blink" : ""}>
          {resultToIcon[guess.result]}
        </span>
      </div>
      <p>{guess.content}</p>
    </div>
  );
}

export default GuessDisplay;