import React from 'react';

export default function BestScores({ bestScores }) {
    return (
        <div id="best-scores" className="info-box">
            <p>BEST</p>
            <dl>
                {bestScores ? bestScores.map(([name, score], index) => <dt key={index}>{name}: {score}</dt>) : undefined}
            </dl>
        </div>
    )
}