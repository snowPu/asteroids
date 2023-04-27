type UFOConfig = {
    maximumCount: number
    ufoUpgradeScoreEvery: number,
    ufoUpgradeLifetimeSeconds: number,
    maxVelocity: number
    shootingProbability: number
}
type AsteroidConfig = {
    initialAsteroidCount: number,
    minimumCount: number,
    asteroidReplenishCount: number,
    maxVelocity: number
}
type GameConfig = {
    ufoConfig: UFOConfig
    asteroidConfig: AsteroidConfig
    lives: number
}

const easy: GameConfig = {
    asteroidConfig: {
        initialAsteroidCount: 15,
        minimumCount: 5,
        asteroidReplenishCount: 10,
        maxVelocity: 8,
    },
    lives: 4,
    ufoConfig: {
        maximumCount: 2,
        ufoUpgradeScoreEvery: 50,
        ufoUpgradeLifetimeSeconds: 12,
        maxVelocity: 8,
        shootingProbability: 0.08,
    }
}

const medium: GameConfig = {
    asteroidConfig: {
        initialAsteroidCount: 20,
        minimumCount: 8,
        asteroidReplenishCount: 15,
        maxVelocity: 8,
    },
    lives: 4,
    ufoConfig: {
        maximumCount: 3,
        ufoUpgradeScoreEvery: 70,
        ufoUpgradeLifetimeSeconds: 10,
        maxVelocity: 8,
        shootingProbability: 0.1,
    }
}

const hard: GameConfig = {
    asteroidConfig: {
        initialAsteroidCount: 25,
        minimumCount: 10,
        asteroidReplenishCount: 20,
        maxVelocity: 10,
    },
    lives: 4,
    ufoConfig: {
        maximumCount: 4,
        ufoUpgradeScoreEvery: 100,
        ufoUpgradeLifetimeSeconds: 8,
        maxVelocity: 10,
        shootingProbability: 0.15,
    }
}