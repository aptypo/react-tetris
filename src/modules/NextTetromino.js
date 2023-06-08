import React from 'react';

export default function NextTetromino( { nextTetromino } ) {
    return (
        <div className="info-box" id="next">
            <p>NEXT</p>
            {nextTetromino}
        </div>
    )
}
