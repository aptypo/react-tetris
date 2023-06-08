import React from 'react';

export default function Block({ leftPosition, topPosition, blockSize, color, animation }) {
    const [red, green, blue] = color;

    return (
        <div style={{
            width: blockSize, animation: animation, height: blockSize,
            backgroundImage: `radial-gradient(farthest-side, rgb(${red + 50}, ${green + 50}, ${blue + 50}), rgb(${red}, ${green}, ${blue}))`,
            position: "absolute", left: leftPosition * blockSize, top: topPosition * blockSize
        }} />
    )
}