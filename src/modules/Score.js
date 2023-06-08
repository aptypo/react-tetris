import React from 'react';

export default function Score( { score } ) {
    return (
        <div className="info-box" id="score">
            <p>SCORE</p>
            <p>{score}</p>
        </div>
    )
}