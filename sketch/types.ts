type Color = {
    r: number
    g: number
    b: number
}


type AsteroidSplit = {
    first: Asteroid
    second: Asteroid
}

type HighScoreList = { [key in Difficulty]: HighScore[] }

type HighScore = {
    name: string
    score: number
}

type Difficulty = 'easy' | 'medium' | 'hard'