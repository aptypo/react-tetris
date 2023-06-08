import React from 'react';

export default function Tetromino( { children, type, rotation, blockSize, leftPosition, topPosition, widthBlocks, heightBlocks, color } ) {
    return (
        <div style={{position: "absolute", left: leftPosition * blockSize, top: topPosition * blockSize}}> 
            {children}
        </div>
    )
}