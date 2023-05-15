import { Puzzle } from "api";
import React from "react";
import "./PuzzleSelect.css";

interface Props {
  puzzle: Puzzle;
  onSelect: React.MouseEventHandler<HTMLDivElement>; 
  selected: boolean;
}

const PuzzleSelect: React.FC<Props> = ({
  puzzle, onSelect, selected
}) => {
  let classnames = "puzzle-select";
  if (selected) {
    classnames += " selected";
  }
  return (
    <div className={classnames} id={`puzzle-select-${puzzle.id}`} onClick={onSelect}>
      <h4>
        {
          puzzle.id === -1 ? "游戏指南": `谜题 #${puzzle.id}`
        }
      </h4>
      <p className="oneline-abbriv">{puzzle.lead }</p>
    </div>
  )
}

export default PuzzleSelect;
