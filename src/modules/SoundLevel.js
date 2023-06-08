import { useEffect, useState } from "react"

export default function SoundLevel({ defaultSoundLevel, soundLevel, setSoundLevel }) {
    const [soundImage, setSoundImage] = useState();
    
    useEffect(() => setSoundImage(soundLevel > 0 ? "sound-on.webp" : "sound-off.png"), [soundLevel]);

    return (
        <div id="sound-level" onClick={() => setSoundLevel(soundLevel => soundLevel > 0 ? 0 : defaultSoundLevel)} style={{ backgroundImage: `url(${soundImage})` }}></div>
    )
}
