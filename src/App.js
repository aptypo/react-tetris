import React from 'react';

import { useEffect, useRef, useState } from 'react';
import './App.css';
import Board from './modules/Board';
import Level from './modules/Level';
import LinesDeleted from './modules/LinesDeleted';
import NextTetromino from './modules/NextTetromino';
import Score from './modules/Score';
import BestScores from './modules/BestScores';
import SoundLevel from './modules/SoundLevel';
import { useStateWithRef } from '.';

function App() {
  const defaultSoundLevel = 0.1;

  const [linesDeleted, setLinesDeleted] = useState(0);
  const [levelHandler, level] = useStateWithRef(0);
  const [scoreHandler, score] = useStateWithRef(0);
  const [nextTetrominoHandler, nextTetromino] = useStateWithRef();
  const [bestScores, setBestScores] = useState([]);

  const [soundLevel, setSoundLevel] = useState(defaultSoundLevel);

  const bestScoresLimit = 10;
  const bestScoresStorageName = "best-scores";

  function recordScore() {
    setBestScores(bestScores => {
      if (score.get() > 0 && (bestScores.length < bestScoresLimit || bestScores.some(([,bestScore]) => bestScore < score.get()))) {
        const name = prompt("Enter your name (max. 8 symbols)")
        if (name) {
          const newBestScores = [...bestScores];
          newBestScores.push([name.slice(0, 8), score.get()]);
          newBestScores.sort(([,leftScore], [,rightScore]) => leftScore < rightScore ? 1 : (leftScore == rightScore ? 0 : -1));
          newBestScores.splice(bestScoresLimit);
          localStorage.setItem(bestScoresStorageName, JSON.stringify(newBestScores));
          return newBestScores;
        } else {
          return bestScores;
        }
      } else {
        return bestScores;
      }
    });
  }

  useEffect(() => {
    const storedBestScores = localStorage.getItem(bestScoresStorageName);
    if (storedBestScores) {
      setBestScores(JSON.parse(storedBestScores));
    }
  },
  []
);

  return (
      <Board score={score} level={level} nextTetromino={nextTetromino} setLinesDeleted={setLinesDeleted} recordScore={recordScore} soundLevel={soundLevel}>
          <SoundLevel defaultSoundLevel={defaultSoundLevel} soundLevel={soundLevel} setSoundLevel={setSoundLevel}></SoundLevel>
          <Score score={scoreHandler}/>
          <Level level={levelHandler}/>
          <NextTetromino nextTetromino={nextTetrominoHandler}/>
          <LinesDeleted linesDeleted={linesDeleted}/>
          <BestScores bestScores={bestScores}/>
      </Board>
  );
}

export default App;
