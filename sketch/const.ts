const spriteRows = 4;
const spriteCols = 4;
const spriteRow = 3;
const D_ACCELERATION = 2
const explosionLength = 40
const SHIP_HEIGHT = 70
const UFO_HEIGHT = 80
const HIGH_SCORES = 'HIGH_SCORES'
const NO_OF_HIGH_SCORES = 10
const CONFIGS: { [key in Difficulty]: GameConfig } = {
    'easy': easy,
    'medium': medium,
    'hard': hard,
}