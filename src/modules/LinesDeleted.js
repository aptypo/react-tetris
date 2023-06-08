import React from 'react';

export default function LinesDeleted( { linesDeleted } ) {
    return (
        <div className="info-box" id="lines-deleted">
            <p>LINES</p>
            <p>{linesDeleted}</p>
        </div>
    )
}