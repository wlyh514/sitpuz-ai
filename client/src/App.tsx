import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { Guess, Puzzle, PuzzleId } from 'api';
import { clearPuzzle, getAllPuzzles, getGuessesOfPuzzle, getStoryOfPuzzle, makeGuess, QueryResult } from './model';
import PuzzleSelect from './components/PuzzleSelect';
import GuessDisplay from './components/Guess';

const guide: Puzzle = {
  id: -1,
  lead: "What is this? Where do I start? "
}

const guessCache: Map<PuzzleId, string> = new Map();

function App() {

  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [fullStory, setFullStory] = useState<string | null>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [guess, setGuess] = useState<string>("");

  const inputRef = useRef<HTMLInputElement>(null);

  const onInputChange: React.ChangeEventHandler<HTMLInputElement> = e => {
    if (currentPuzzle) {
      setGuess(e.target.value);
      guessCache.set(currentPuzzle.id, e.target.value);
    }
  }

  const submitGuess = () => {
    if (processing || !currentPuzzle || currentPuzzle.id < 0 || !guess) {
      return;
    }

    setProcessing(true);
    setGuess("");
    guessCache.set(currentPuzzle.id, "");

    const newGuess: Guess = {
      content: guess,
      result: QueryResult.PENDING,
    }

    const oldGuesses = guesses;

    setGuesses([...oldGuesses, newGuess]);

    makeGuess(currentPuzzle.id, guess)
      .then(result => {
        setGuesses([...oldGuesses, result.guess]);
        if (result.story) {
          setFullStory(result.story);
        }
      })
      .catch(console.error)
      .finally(() => {
        setProcessing(false);
      })
  }

  const restart = () => {
    setGuesses([]);
    setFullStory(null);
    if (currentPuzzle) {
      clearPuzzle(currentPuzzle.id);
    }
  }

  const handleEnterKeydown: React.KeyboardEventHandler<HTMLInputElement> = e => {
    if (e.key === "Enter") {
      submitGuess();
    }
  }

  useEffect(() => {
    if (currentPuzzle) {
      getGuessesOfPuzzle(currentPuzzle?.id)
        .then(guesses => {
          setGuesses(guesses); 
          if (guesses.find(g => g.result === QueryResult.GAMEOVER)) {
            getStoryOfPuzzle(currentPuzzle.id)
              .then(story => setFullStory(story));
          } else {
            setFullStory(null);
          }
        });
      setGuess(guessCache.get(currentPuzzle.id) || "");
    } else {
      setGuess("");
    }
  }, [currentPuzzle]);

  useEffect(() => {
    getAllPuzzles()
      .then(resp => {
        setPuzzles(resp.puzzles);
      })
      .catch(console.error)
      .finally(() => {
        setPuzzles(oldPuzzles => {
          if (oldPuzzles.find(p => p.id === -1)) {
            return oldPuzzles
          }
          return [guide, ...oldPuzzles];
        });
        setCurrentPuzzle(guide);
      })
  }, []);

  useEffect(() => {
    if (!processing) {
      inputRef.current?.focus();
    }
  }, [processing])

  return (
  <div className="home-page">
    <div className='header'>
      <h1><a href='https://en.wikipedia.org/wiki/Situation_puzzle' target='_blank' rel="noreferrer">Situation Puzzle </a>Powered by GPT</h1>
    </div>
    
    <div className="row main">
      <div className="select-puzzle col-3 col-sm-12">
        {
          puzzles.length ? 
            puzzles.sort((p1, p2) => p1.id - p2.id).map((p, indx) => 
              <PuzzleSelect 
                puzzle={p} 
                onSelect={() => setCurrentPuzzle(p)} 
                selected={currentPuzzle === p} 
                key={indx}
              />) 
            : "Loading puzzles……"
        }
      </div>

      <div className="puzzle col-9 col-sm-12">
        <div className="guesses-container">
          {
            currentPuzzle && guesses.length === 0 && currentPuzzle.id >= 0 ? 
              <p>Start by submitting a guess (e.g. "This person is mad.")</p>
              : null
          }
          {
            currentPuzzle?.id === -1 ?
              <>
                <h1>What is this?</h1>
                <p>
                  Situation Puzzle (aka. "yes/no" puzzle, minute mysteries) is a type of game that involves problem-solving. In this game, one player presents a hypothetical situation, often mysterious, odd or seemingly absurd, and other players try to solve the puzzle by making guesses, which can be answered by the presenter with "yes", "no", or "irrelevant." The game continues until a player correctly resolves the situation, usually by distinguishing how and why a certain situation occurred. Read more on <a href="https://en.wikipedia.org/wiki/Situation_puzzle" target="_blank" rel="noreferrer">wikipedia</a>.
                </p>
                <h1>How to get started?</h1>
                <p>
                  You can switch to puzzles by clicking items in the <span className="highlight">puzzle list <span className="wide-screen-only">on the left side</span><span className="narrow-screen-only">above</span> </span>. On the puzzles screen, you can enter your declarative guess of the plot in the <span className="highlight">textbox below</span>, use the button on the right <span className="wide-screen-only">or the enter key</span> to submit your guess. After submission, GPT will deduce whether the statement is correct. 
                </p>
                <GuessDisplay guess={{result: QueryResult.PENDING, content: "This statement is being processed by GPT."}} />
                <p>
                  A statement after being processed yields one of the following:
                </p>
                <GuessDisplay guess={{result: QueryResult.TRUE, content: "This statement matches with the narrative, but does not capture everything. "}} />
                <GuessDisplay guess={{result: QueryResult.FALSE, content: "This statement contradicts with the narrative."}} />
                <GuessDisplay guess={{result: QueryResult.UNRELATED, content: "This statement is irrelevant. "}} />
                <GuessDisplay guess={{result: QueryResult.ERROR, content: "An error occured processing this statement. Not my fault I guess.  "}} />
                <p>
                  After gathering enough information, you can attempt to summerize the entirety of the plot. 
                </p>
                <GuessDisplay guess={{result: QueryResult.GAMEOVER, content: "This statement captures the whole plot. You win!"}} />
                <p>
                  Happy gaming!
                </p>
                <p>
                  Author's Github profile: <a href="https://github.com/wlyh514" target='_blank' rel="noreferrer">wlyh514</a>; <a href="https://github.com/wlyh514/sitpuz-ai" target='_blank' rel="noreferrer">repository of this site. </a>
                </p>
              </>
              :
              guesses.map((g, indx) => <GuessDisplay key={indx} guess={g} />)
          }
          {
            currentPuzzle && fullStory ? 
              <>
                <h1>You win!</h1>
                <p>The entire plot: {fullStory} <a onClick={restart}><b>Restart</b></a></p>
              </>
              :
              null
          }
          <br />
          <br />
          <br />
          <br />
          <br />
        </div>
        <div className="input-container">
          <input 
            type="text" 
            autoComplete="off" 
            name="guess" 
            id="guess" 
            placeholder='Place your guess here' 
            onChange={onInputChange}
            onKeyDown={handleEnterKeydown}
            value={guess}
            disabled={processing || fullStory !== null}
            ref={inputRef}
          ></input>

          <input 
            type="submit" 
            value="🤖" 
            onClick={submitGuess}
            disabled={processing || fullStory !== null}
          />
        </div>
      </div>
    </div>
  </div>)
}

export default App;
