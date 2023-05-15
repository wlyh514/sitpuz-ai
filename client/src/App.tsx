import React, { useEffect, useRef, useState } from 'react';
import './App.css';
import { Guess, Puzzle, PuzzleId } from 'api';
import { clearPuzzle, getAllPuzzles, getGuessesOfPuzzle, getStoryOfPuzzle, makeGuess, QueryResult } from './model';
import PuzzleSelect from './components/PuzzleSelect';
import GuessDisplay from './components/Guess';

const guide: Puzzle = {
  id: -1,
  lead: "这是什么？怎么玩？"
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
  }, [currentPuzzle, processing])

  return (
  <div className="home-page">
    <div className='header'>
      <h1>基于GPT的<a href='https://baike.baidu.com/item/%E6%83%85%E5%A2%83%E7%8C%9C%E8%B0%9C' target='_blank' rel="noreferrer">海龟汤/情境猜谜</a></h1>
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
            : "加载谜题中……"
        }
      </div>

      <div className="puzzle col-9 col-sm-12">
        <div className="guesses-container">
          {
            currentPuzzle && guesses.length === 0 && currentPuzzle.id >= 0 ? 
              <p>提交一个推断来开始游戏（例如：“这个人有精神病”）</p>
              : null
          }
          {
            currentPuzzle?.id === -1 ?
              <>
                <h1>这是什么？</h1>
                <p>
                  情境猜谜（俗称“海龟汤”）是一种以推测出故事全貌为目标的猜谜游戏。在游戏中你将扮演「猜题者」，通过做出一系列推断来试图缩小猜测范围，逐步发掘「故事全貌」的真相。详见<a href="https://baike.baidu.com/item/%E6%83%85%E5%A2%83%E7%8C%9C%E8%B0%9C" target="_blank" rel="noreferrer">百度百科</a>或<a href="https://zh.wikipedia.org/zh-cn/%E6%83%85%E5%A2%83%E7%8C%9C%E8%AC%8E" target="_blank" rel="noreferrer">维基百科</a>。
                </p>
                <h1>怎么玩？</h1>
                <p>
                  您可以通过点击<span className="highlight"><span className="wide-screen-only">左侧</span><span className="narrow-screen-only">上方</span>谜题列表</span>中的项目来切换至该谜题。在谜题界面，您可以通过<span className="highlight">下方文本框</span>输入您对于该谜题的推断(<span className="highlight">请使用陈述句</span>)，按右侧按钮<span className="wide-screen-only">或Enter键</span>提交。提交后，GPT会判断您的推断是否正确。
                </p>
                <GuessDisplay guess={{result: QueryResult.PENDING, content: "这条推断正在被GPT处理。"}} />
                <p>
                  推断经过处理后，会得到以下结果中的一种：
                </p>
                <GuessDisplay guess={{result: QueryResult.TRUE, content: "这条推断与故事相符，但不是故事的全貌。"}} />
                <GuessDisplay guess={{result: QueryResult.FALSE, content: "这条推断与故事不符。"}} />
                <GuessDisplay guess={{result: QueryResult.UNRELATED, content: "这条推断与故事无明显关联。"}} />
                <GuessDisplay guess={{result: QueryResult.ERROR, content: "处理这条推断导致了某种技术错误，怎么回事呢？"}} />
                <p>
                  收集到足够的信息后，您可以在推断中写出您对于故事全貌的推测。
                </p>
                <GuessDisplay guess={{result: QueryResult.GAMEOVER, content: "这条推断完整地描述了故事全貌。您赢了！"}} />
                <p>
                  祝您游戏愉快！
                </p>
                <p>
                  另：当前AI提供的判断准确度欠佳，作者正在试图解决这一问题。如果有相关建议还请赐教。作者GitHub: <a href="https://github.com/wlyh514/sitpuz-ai" >wlyh514</a>
                </p>
              </>
              :
              guesses.map((g, indx) => <GuessDisplay key={indx} guess={g} />)
          }
          {
            currentPuzzle && fullStory ? 
              <>
                <h1>您赢了</h1>
                <p>故事全文：{fullStory} <a onClick={restart}><b>重新开始</b></a></p>
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
            placeholder='写下你的推断' 
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
