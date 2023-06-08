import React, { useEffect, useRef, useState } from 'react';
import Block from './Block';
import Tetromino from './Tetromino';
import { useStateWithRef } from '..';

export default function Board({ children, score, level, nextTetromino, setLinesDeleted, recordScore, soundLevel }) {

    const TetrominosTypes = {
        I: "I",
        O: "O",
        T: "T",
        S: "S",
        Z: "Z",
        J: "J",
        L: "L"
    }

    const GameState = {
        Running: "Running",
        ProcessingMove: "ProcessingMove",
        Paused: "Paused",
        GameOver: "GameOver"
    }

    const [audioPause] = useState(() => new Audio("pause.mp3"));
    const [audioBackground] = useState(() => new Audio("background.mp3"));
    const [audioMoveHorizontally] = useState(() => new Audio("move-horizontally.mp3"));
    const [audioSlice] = useState(() => new Audio("slice.mp3"));
    const [audioDrop] = useState(() => new Audio("drop.mp3"));
    const [audioGameOver] = useState(() => new Audio("game-over.mp3"));
    const [audioLevelUp] = useState(() => new Audio("level-up.mp3"));
    const [audioRotate] = useState(() => new Audio("rotate.mp3"));

    const [currentTetrominoHandler, currentTetromino] = useStateWithRef();
    const [deadTetrominosHandler, deadTetrominos] = useStateWithRef([]);
    const [gameStateHandler, gameState] = useStateWithRef(GameState.Running);

    const intervalListenerIdRef = useRef();
    const keyEventListenerIdRef = useRef();

    const blockSize = 30;
    const boardWidthBlocks = 10;
    const boardHeightBlocks = 20;

    useEffect(() => {
        currentTetromino.set(generateNewTetromino(3, 0));
        nextTetromino.set(generateNewTetromino(1, 1));

        keyEventListenerIdRef.current = window.addEventListener('keydown', keyEventHandler);

        return () => {
            window.removeEventListener('keydown', keyEventListenerIdRef.current);
            clearInterval(intervalListenerIdRef.current);
            intervalListenerIdRef.current = null;
            keyEventListenerIdRef.current = null;
        };
    }, []);

    useEffect(() => {

        [audioPause,
            audioBackground,
            audioMoveHorizontally,
            audioSlice,
            audioDrop,
            audioGameOver,
            audioLevelUp,
            audioRotate].forEach(audio => audio.volume = soundLevel);
    }, [soundLevel]
    )

    function getCurrentLevelSpeed() {
        const framesPerMoveByLevel = [48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2];
        const framesPerMove = level.get() > framesPerMoveByLevel.length ? 1 : framesPerMoveByLevel[level.get()];
        return 1000 / 60 * framesPerMove;
    }

    useEffect(() => {
        console.log("state change", gameState.get())
            if (gameState.get() === GameState.GameOver) {
                clearInterval(intervalListenerIdRef.current);
                intervalListenerIdRef.current = null;
                audioBackground.pause();
                forcePlayAudio(audioGameOver);
            } else if (gameState.get() === GameState.Paused) {
                clearInterval(intervalListenerIdRef.current);
                intervalListenerIdRef.current = null;

                audioBackground.pause();
                forcePlayAudio(audioPause);
            } else {
                if (audioBackground.paused) {
                    forcePlayAudio(audioBackground);
                }
                // LEVEL UP CHANGE SPEED ????
                if (!intervalListenerIdRef.current) {
                    console.log("set interval")
                    intervalListenerIdRef.current = setInterval(moveDownCurrentTetromino, getCurrentLevelSpeed());
                }
            }
        },
        [gameStateHandler]
    )


    function forcePlayAudio(audio) {
        if (!audio.paused) {
            audio.load();
        }
        audio.play();
    }

    function generateNewTetromino(leftPosition, topPosition) {
        const type = TetrominosTypes[Object.keys(TetrominosTypes)[Math.round(Math.random() * 10) % Object.keys(TetrominosTypes).length]];
        const color = [Math.round(Math.random() * 220), Math.round(Math.random() * 220), Math.round(Math.random() * 220)];
        return buildTetromino(type, 0, leftPosition, topPosition, color)
    }

    function pauseOrResume() {
        if (gameState.get() === GameState.Running) {
            gameState.set(GameState.Paused);
        } else if (gameState.get() === GameState.Paused) {
            gameState.set(GameState.Running);
        }
    }

    function onRowsDeletion(rowsDeleted) {
        const increaseScore = () => {
            const basePointsByDeletedRows = [40, 100, 300, 1200];
            score.set(score.get() + (basePointsByDeletedRows[rowsDeleted - 1] * (level.get() + 1)));
        }
        const updateLinesDeleted = () => {
            setLinesDeleted(linesDeleted => {
                const newLinesDeleted = linesDeleted + rowsDeleted;
                const nextLevel = Math.trunc(newLinesDeleted / 10);
                if (nextLevel > level.get()) {
                    forcePlayAudio(audioLevelUp);
                }
                level.set(nextLevel);
                return newLinesDeleted;
            });
        }

        if (rowsDeleted > 0) {
            increaseScore();
            updateLinesDeleted();
        }
    }

    function rotateCurrentTetromino(rotateBackwards) {
        if (gameState.get() === GameState.Running) {
            gameState.set(GameState.ProcessingMove);

            const currentRotation = currentTetromino.get().props.rotation;
            const nextRotation = rotateBackwards ? (currentRotation + 270) % 360 : (currentRotation + 90) % 360;
            const rotatedTetromino = buildTetromino(currentTetromino.get().props.type, nextRotation, currentTetromino.get().props.leftPosition, currentTetromino.get().props.topPosition, currentTetromino.get().props.color);

            if (tetrominoHasLegalPosition(rotatedTetromino)) {
                forcePlayAudio(audioRotate);
                currentTetromino.set(rotatedTetromino);
            }
            gameState.set(GameState.Running);
        }
    }

    function moveHorizontallyCurrentTetromino(moveLeft) {
        if (gameState.get() === GameState.Running) {
            gameState.set(GameState.ProcessingMove);

            const currentLeftPosition = currentTetromino.get().props.leftPosition;
            const nextLeftPosition = moveLeft ? currentLeftPosition - 1 : currentLeftPosition + 1;
            const movedTetromino = buildTetromino(currentTetromino.get().props.type, currentTetromino.get().props.rotation, nextLeftPosition, currentTetromino.get().props.topPosition, currentTetromino.get().props.color);

            if (tetrominoHasLegalPosition(movedTetromino)) {
                forcePlayAudio(audioMoveHorizontally);
                currentTetromino.set(movedTetromino);
            }
            gameState.set(GameState.Running);
        }
    }

    function getBlockBoardPosition(tetromino, block) {
        const leftPosition = tetromino.props.leftPosition + block.props.leftPosition;
        const topPosition = tetromino.props.topPosition + block.props.topPosition;
        return [leftPosition, topPosition];
    }

    function tetrominoHasLegalPosition(tetromino) {
        const tetrominoBlocksBoardPositions = tetromino.props.children.map(block => getBlockBoardPosition(tetromino, block));
        const deadBlocksBoardPositions = deadTetrominos.get().flatMap(tetromino => tetromino.props.children.map(block => getBlockBoardPosition(tetromino, block)))
        const overlapsWithDeadBlocks = tetrominoBlocksBoardPositions.some(([blockBoardLeftPosition, blockBoardTopPosition]) =>
            deadBlocksBoardPositions.some(([deadBlockBoardLeftPosition, deadBlockBoardTopPosition]) =>
                blockBoardLeftPosition === deadBlockBoardLeftPosition && blockBoardTopPosition === deadBlockBoardTopPosition
            )
        )
        const isWithinBoard = tetrominoBlocksBoardPositions.every(([blockBoardLeftPosition, blockBoardTopPosition]) => {
            return blockBoardLeftPosition >= 0 && blockBoardLeftPosition < boardWidthBlocks && blockBoardTopPosition >= 0 && blockBoardTopPosition < boardHeightBlocks
        });
        return !overlapsWithDeadBlocks && isWithinBoard;
    }

    async function moveDownCurrentTetromino() {
        if (gameState.get() === GameState.Running) {
            gameState.set(GameState.ProcessingMove);

            const movedTetromino = buildTetromino(currentTetromino.get().props.type, currentTetromino.get().props.rotation, currentTetromino.get().props.leftPosition, currentTetromino.get().props.topPosition + 1, currentTetromino.get().props.color);

            if (tetrominoHasLegalPosition(movedTetromino)) {
                currentTetromino.set(movedTetromino);
                gameState.set(GameState.Running);
            } else {
                forcePlayAudio(audioDrop);

                const allTetrominos = [...deadTetrominos.get(), currentTetromino.get()];
                const deadRowsToDelete = allTetrominos
                    .flatMap(tetromino => tetromino.props.children.map(block => getBlockBoardPosition(tetromino, block)))
                    .reduce((acc, [leftBoardPosition, topBoardPosition]) => {
                        acc[topBoardPosition][leftBoardPosition] = true;
                        return acc;
                    }, new Array(boardHeightBlocks).fill(null).map(() => new Array(boardWidthBlocks).fill(false)))
                    .flatMap((rowBitmap, index) => rowBitmap.every(bit => bit) ? [index] : [])

                // blink
                let promise;
                if (deadRowsToDelete.length > 0) {
                    const xx = allTetrominos.map(tetromino => {
                        const newChildren = tetromino.props.children.map(block => {
                            const [, topBoardPosition] = getBlockBoardPosition(tetromino, block);
                            if (deadRowsToDelete.includes(topBoardPosition)) {
                                return buildBlock(block.props.leftPosition, block.props.topPosition, block.props.color, block.key, "blinker 500ms");
                            } else {
                                return block;
                            }
                        });
                        return buildTetrominoFromBlocks(newChildren, tetromino.props.type, tetromino.props.rotation, tetromino.props.leftPosition, tetromino.props.topPosition, tetromino.props.color);
                    });
                    forcePlayAudio(audioSlice);

                    deadTetrominos.set(xx);
                    currentTetromino.set();
                    promise = new Promise(resolver => setTimeout(resolver, 500));
                } else {
                    promise = Promise.resolve();
                }

                promise.then(() => {
                    const newDeadTetrominos = allTetrominos.flatMap(tetromino => {
                        const newChildren = tetromino.props.children.flatMap(block => {
                            const [, topBoardPosition] = getBlockBoardPosition(tetromino, block);
                            if (deadRowsToDelete.includes(topBoardPosition)) {
                                return [];
                            } else if (deadRowsToDelete.some(topPosition => topPosition > topBoardPosition)) {
                                const rowsShift = deadRowsToDelete.filter(topPosition => topPosition > topBoardPosition).length
                                return buildBlock(block.props.leftPosition, block.props.topPosition + rowsShift, block.props.color, block.key)
                            } else {
                                return block;
                            }
                        });
                        return newChildren.length == 0 ? [] : [buildTetrominoFromBlocks(newChildren, tetromino.props.type, tetromino.props.rotation, tetromino.props.leftPosition, tetromino.props.topPosition, tetromino.props.color)]
                    }
                    )

                    onRowsDeletion(deadRowsToDelete.length);

                    deadTetrominos.set(newDeadTetrominos);

                    const newCurrentTetromino = buildTetrominoFromBlocks(nextTetromino.get().props.children, nextTetromino.get().props.type, nextTetromino.get().props.rotation, 3, 0, nextTetromino.get().props.color);

                    if (tetrominoHasLegalPosition(newCurrentTetromino)) {
                        currentTetromino.set(newCurrentTetromino);
                        nextTetromino.set(generateNewTetromino(1, 1));
                        gameState.set(GameState.Running);
                    } else {
                        gameState.set(GameState.GameOver);
                        setTimeout(recordScore, 100);
                    }
                });
            }
        }
    }

    function keyEventHandler(event) {
        switch (event.code) {
            case "ArrowUp":
                break;
            case "ArrowDown":
                moveDownCurrentTetromino()
                break;
            case "ArrowLeft":
                moveHorizontallyCurrentTetromino(true)
                break;
            case "ArrowRight":
                moveHorizontallyCurrentTetromino(false)
                break;
            case "Space":
                break;
            case "KeyZ":
                rotateCurrentTetromino(true)
                break;
            case "KeyX":
                rotateCurrentTetromino(false)
                break;
            case "Enter":
                pauseOrResume();
                break;
            default:
                break;
        }
    }

    function buildBlock(leftPosition, topPosition, color, key, animation) {
        return <Block leftPosition={leftPosition} topPosition={topPosition} blockSize={blockSize} key={key} color={color} animation={animation} />;
    }

    function buildTetromino(type, rotation, leftPosition, topPosition, color) {
        let blocks = [];
        if (type === TetrominosTypes.I) {
            if (rotation === 0 || rotation === 180) {
                blocks = [
                    buildBlock(0, 0, color, 0),
                    buildBlock(1, 0, color, 1),
                    buildBlock(2, 0, color, 2),
                    buildBlock(3, 0, color, 3)
                ]
            } else {
                blocks = [
                    buildBlock(0, 0, color, 0),
                    buildBlock(0, 1, color, 1),
                    buildBlock(0, 2, color, 2),
                    buildBlock(0, 3, color, 3)
                ]
            }
        } else if (type === TetrominosTypes.O) {
            blocks = [
                buildBlock(0, 0, color, 0),
                buildBlock(1, 0, color, 1),
                buildBlock(0, 1, color, 2),
                buildBlock(1, 1, color, 3)
            ]
        } else if (type === TetrominosTypes.T) {
            if (rotation === 0) {
                blocks = [
                    buildBlock(0, 0, color, 0),
                    buildBlock(1, 0, color, 1),
                    buildBlock(2, 0, color, 2),
                    buildBlock(1, 1, color, 3)
                ]
            } else if (rotation === 90) {
                blocks = [
                    buildBlock(1, 0, color, 0),
                    buildBlock(1, 1, color, 1),
                    buildBlock(1, 2, color, 2),
                    buildBlock(2, 1, color, 3)
                ]
            } else if (rotation === 180) {
                blocks = [
                    buildBlock(0, 2, color, 0),
                    buildBlock(1, 2, color, 1),
                    buildBlock(2, 2, color, 2),
                    buildBlock(1, 1, color, 3)
                ]
            } else if (rotation === 270) {
                blocks = [
                    buildBlock(1, 0, color, 0),
                    buildBlock(1, 1, color, 1),
                    buildBlock(1, 2, color, 2),
                    buildBlock(0, 1, color, 3)
                ]
            }
        } else if (type === TetrominosTypes.S) {
            if (rotation === 0 || rotation === 180) {
                blocks = [
                    buildBlock(0, 1, color, 0),
                    buildBlock(1, 1, color, 1),
                    buildBlock(1, 0, color, 2),
                    buildBlock(2, 0, color, 3)
                ]
            } else {
                blocks = [
                    buildBlock(0, 0, color, 0),
                    buildBlock(0, 1, color, 1),
                    buildBlock(1, 1, color, 2),
                    buildBlock(1, 2, color, 3)
                ]
            }
        } else if (type === TetrominosTypes.Z) {
            if (rotation === 0 || rotation === 180) {
                blocks = [
                    buildBlock(0, 0, color, 0),
                    buildBlock(1, 0, color, 1),
                    buildBlock(1, 1, color, 2),
                    buildBlock(2, 1, color, 3)
                ]
            } else {
                blocks = [
                    buildBlock(1, 0, color, 0),
                    buildBlock(1, 1, color, 1),
                    buildBlock(0, 1, color, 2),
                    buildBlock(0, 2, color, 3)
                ]
            }
        } else if (type === TetrominosTypes.J) {
            if (rotation === 0) {
                blocks = [
                    buildBlock(0, 0, color, 0),
                    buildBlock(1, 0, color, 1),
                    buildBlock(2, 0, color, 2),
                    buildBlock(2, 1, color, 3)
                ]
            } else if (rotation === 90) {
                blocks = [
                    buildBlock(1, 0, color, 0),
                    buildBlock(1, 1, color, 1),
                    buildBlock(1, 2, color, 2),
                    buildBlock(0, 2, color, 3)
                ]
            } else if (rotation === 180) {
                blocks = [
                    buildBlock(0, 0, color, 0),
                    buildBlock(0, 1, color, 1),
                    buildBlock(1, 1, color, 2),
                    buildBlock(2, 1, color, 3)
                ]
            } else if (rotation === 270) {
                blocks = [
                    buildBlock(0, 0, color, 0),
                    buildBlock(0, 1, color, 1),
                    buildBlock(0, 2, color, 2),
                    buildBlock(1, 0, color, 3)
                ]
            }
        } else if (type === TetrominosTypes.L) {
            if (rotation === 0) {
                blocks = [
                    buildBlock(0, 0, color, 0),
                    buildBlock(1, 0, color, 1),
                    buildBlock(2, 0, color, 2),
                    buildBlock(0, 1, color, 3)
                ]
            } else if (rotation === 90) {
                blocks = [
                    buildBlock(0, 0, color, 0),
                    buildBlock(1, 0, color, 1),
                    buildBlock(1, 1, color, 2),
                    buildBlock(1, 2, color, 3)
                ]
            } else if (rotation === 180) {
                blocks = [
                    buildBlock(0, 1, color, 0),
                    buildBlock(1, 1, color, 1),
                    buildBlock(2, 1, color, 2),
                    buildBlock(2, 0, color, 3)
                ]
            } else if (rotation === 270) {
                blocks = [
                    buildBlock(0, 0, color, 0),
                    buildBlock(0, 1, color, 1),
                    buildBlock(0, 2, color, 2),
                    buildBlock(1, 2, color, 3)
                ]
            }
        }
        return buildTetrominoFromBlocks(blocks, type, rotation, leftPosition, topPosition, color)
    }

    function buildTetrominoFromBlocks(blocks, type, rotation, leftPosition, topPosition, color) {
        const [widthBlocks, heightBlocks] = blocks.reduce(([maxWidthBlocks, maxHeightBlocks], block) => {
            return [Math.max(maxWidthBlocks, block.props.leftPosition - leftPosition + 1), Math.max(maxHeightBlocks, block.props.topPosition - topPosition + 1)]
        }, [0, 0]);

        return (
            <Tetromino type={type} rotation={rotation} blockSize={blockSize} leftPosition={leftPosition} topPosition={topPosition} widthBlocks={widthBlocks} heightBlocks={heightBlocks} key={Math.random()} color={color}>
                {blocks}
            </Tetromino>
        )
    }

    return (
        <div style={{
            margin: "auto", zIndex: 1,
            width: (boardWidthBlocks * blockSize), height: (boardHeightBlocks * blockSize), backgroundColor: "beige", position: "relative",
            outlineColor: "darkgray",
            outlineStyle: "solid",
            outlineWidth: 10,
            opacity: "97%"
        }}>
            {children}
            {currentTetrominoHandler}
            {deadTetrominosHandler}
            <div className="pop-up info-box" hidden={gameStateHandler !== GameState.GameOver}>GAME OVER</div>
            <div className="pop-up info-box" hidden={gameStateHandler !== GameState.Paused}>PAUSE</div>
        </div>
    )
}