class Game {
	config: GameConfig
    ship: Ship
    asteroids: Asteroid[]
    explosions: Explosion[]
	ufos: UFO[]
    score: number
    lives: number
	state: 'PAUSED' | 'RUNNING' | 'START' | 'END' | 'NEWLIFE'
	playerName: string
	nextUpgradeUFO: number

    constructor(playerName: string, config: GameConfig) {
		this.playerName = playerName
		this.config = config
        this.ship = new Ship(
            width / 2,
            height - SHIP_HEIGHT,
            shipImage.width / shipImage.height * SHIP_HEIGHT,
            SHIP_HEIGHT, shipImage, shipWithThrustImage
        )

        this.asteroids = []
		this._addRandomAsteroids(config.asteroidConfig.initialAsteroidCount)

        this.explosions = []
		this.ufos = []
        this.score = 0
        this.lives = config.lives
		this.state = 'START'
		this.nextUpgradeUFO = config.ufoConfig.ufoUpgradeScoreEvery
    }

	public moveElements() {
		if (this.state == 'RUNNING') {
			this.ship.move()
			this.asteroids.forEach(asteroid => asteroid.move())
			this.ship.lasers.forEach(laser => laser.move())
		}
		this.explosions.forEach(explosion => explosion.animate())
		this.ufos.forEach(ufo => {
			ufo.move()
			ufo.decrementLife()
			ufo.lasers.forEach(laser => laser.move())
		})
	}

	public addRemoveElementsFromGame() {
		this._removeOffScreenLasers()
		this._replenishAsteroids()
		this._removeExpiredUFOs()
		this._replenishUFOS()
		const randomNumber = Math.random()
		if (randomNumber < this.config.ufoConfig.shootingProbability) this.ufos.forEach(ufo => ufo.shoot())
	}

	public drawElements() {
		if (this.state != 'END') {
			this.ship.draw()
			this.asteroids.forEach(asteroid => asteroid.draw())
			this.ship.lasers.forEach(laser => laser.draw())
		}
		this._removeOldExplosions()
		this.explosions.forEach(explosion => explosion.draw())
		this.ufos.forEach(ufo => {
			ufo.draw()
			ufo.lasers.forEach(laser => laser.draw())
		})
	}

	public rotateShipLeft() {
		this.ship.rotate_left()
	}

	public rotateShipRight() {
		this.ship.rotate_right()
	}

	public acclerateShipUpwards() {
		this.ship.isAccelerating = true
		this.ship.accelerate(D_ACCELERATION)
	}

	public acclerateShipDownwards() {
		this.ship.isAccelerating = true
		this.ship.accelerate(-D_ACCELERATION)
	}

	public decelerateShip() {
		this.ship.decelerate()
	}

    public newLife() {
        this.ship.setPosition(createVector(width / 2, height - SHIP_HEIGHT))
        this.ship.setVelocity(createVector(0, 0))
        this.ship.setRotation(0)
		this.state = 'NEWLIFE'
        this.lives --
    }

    public incrementScore(by: number = 1) {
        this.score += by
    }

	public startGame() {
		this.state = 'RUNNING'
	}
	public resumeGame() {
		this.state = 'RUNNING'
	}
	public pauseGame() {
		this.state = 'PAUSED'
	}

	public endGame() {
		this.state = 'END'
		ufoSound.pause()
	}

	public checkCollisions() {
		if (this.state == 'RUNNING') {
			this._checkAsteroidsShipCollisions()
			this._checkAsteroidsLaserCollision()
			this._checkUFOCollisions()
			this._checkShipLaserCollision()
		}
	}

	private _checkUFOCollisions() {
		let ufoIdx;
        let laserIdx;
		for (ufoIdx = 0; ufoIdx < this.ufos.length; ufoIdx ++) {
			if (this._collideShipUFO(ufoIdx)) {
				break
			}
			for (laserIdx = 0; laserIdx < this.ship.lasers.length; laserIdx ++) {
				if (this._collideLaserUFO(laserIdx, ufoIdx)) {
					break
				}
			}
		}
	}

    private _checkShipLaserCollision() {
		let ufoIdx;
		for (ufoIdx = 0; ufoIdx < this.ufos.length; ufoIdx ++) {
			let laserIdx;
			for (laserIdx = 0; laserIdx < this.ufos[ufoIdx].lasers.length; laserIdx ++) {
				if (this._collideShipUFOLaser(ufoIdx, laserIdx)) {
					break
				}
			}
		}
	}

    private _checkAsteroidsShipCollisions() {
        let asteroidIdx;
        for (asteroidIdx = 0; asteroidIdx < this.asteroids.length; asteroidIdx ++) {
            if (this._collideShipAsteroid(asteroidIdx)) {
				break
			}
        }
    }

    private _checkAsteroidsLaserCollision() {
        let laserIdx;
        let asteroidIdx;
        for (asteroidIdx = 0; asteroidIdx < this.asteroids.length; asteroidIdx ++) {
            for (laserIdx = 0; laserIdx < this.ship.lasers.length; laserIdx ++) {
				if (this._collideLaserAsteroid(laserIdx, asteroidIdx)) {
					break
				}
			}
		}
	}
	private _collideLaserUFO(laserIdx: number, ufoIdx: number): boolean {
		const laser = this.ship.lasers[laserIdx]
		const ufo = this.ufos[ufoIdx]
		if (collideLaserUFO(laser, ufo)) {
			explosionSound.play()
			this.incrementScore(5)
			this._removeLaser(laserIdx)
			this._removeUFO(ufoIdx)
			this._addExplosion(ufo.position.copy(), 1.5, ufo.height)
			if (ufo.type == 'UPGRADE') this.lives ++
			if (this.ufos.length == 0) {
				ufoSound.pause()
			}
			return true
		}
		return false
	}

	private _collideLaserAsteroid(laserIdx: number, asteroidIdx: number): boolean {
		const laser = this.ship.lasers[laserIdx]
		const asteroid = this.asteroids[asteroidIdx]
		if (collideLaserAsteroid(laser, asteroid)) {
			explosionSound.play()
			this.incrementScore()
			this._removeLaser(laserIdx)
			this._removeAsteroid(asteroidIdx)
			if (asteroid.type == 'Full') {
				this._addAsteroids([
					new Asteroid(asteroidImage, createVector(-asteroid.velocity.x, -asteroid.velocity.y), asteroid.position.copy(), 'Half'),
					new Asteroid(asteroidImage, createVector(asteroid.velocity.x, asteroid.velocity.y), asteroid.position.copy(), 'Half')
				])
			} else {
				this._addExplosion(asteroid.position.copy(), 1.5, asteroid.radius)
			}
			return true
		}
		return false
	}

	private _collideShipUFOLaser(ufoIdx: number, laserIdx: number): boolean {
		const laser = this.ufos[ufoIdx].lasers[laserIdx]
		if (collideLaserShip(laser, this.ship)) {
			explosionSound.play()
			this._addExplosion(this.ship.position.copy(), 3, this.ship.height)
			this._removeUFOLaser(ufoIdx, laserIdx)
			this.newLife()
			return true
		}
		return false
	}

	private _collideShipAsteroid(asteroidIdx: number): boolean {
		const asteroid = this.asteroids[asteroidIdx]
		if (collideShipAsteroid(this.ship, asteroid)) {
			explosionSound.play()
			this._addExplosion(this.ship.position.copy(), 3, this.ship.height)
			this._removeAsteroid(asteroidIdx)
			this.newLife()
			return true
		}
		return false
	}

	private _collideShipUFO(ufoIdx: number): boolean {
		const ufo = this.ufos[ufoIdx]
		if (collideShipUFO(this.ship, ufo)) {
			explosionSound.play()
			this._addExplosion(this.ship.position.copy(), 3, this.ship.height)
			this._removeUFO(ufoIdx)
			this.newLife()
			return true
		}
		return false
	}

	private _removeAsteroid(asteroidIndex: number) {
		this.asteroids.splice(asteroidIndex, 1)
	}

	private _removeUFO(ufoIndex: number) {
		this.ufos.splice(ufoIndex, 1)
	}


	private _replenishAsteroids() {
		if (this.asteroids.length < this.config.asteroidConfig.minimumCount) {
			this._addRandomAsteroids(this.config.asteroidConfig.asteroidReplenishCount)
		}
	}

	private _addRandomAsteroids(count: number) {
		for (let i = 0; i < count; i ++) {
			let position: p5.Vector
			while (!position || p5.Vector.dist(position, this.ship.position) < (this.ship.height + FULL_RADIUS + 10)) {
				position = createVector(random(0, width), random(0, height))
			}
			console.log(this.config)
			const velocity: p5.Vector = createVector(
				random(-this.config.asteroidConfig.maxVelocity, this.config.asteroidConfig.maxVelocity),
				random(-this.config.asteroidConfig.maxVelocity, this.config.asteroidConfig.maxVelocity)
			)
			this._addAsteroids([new Asteroid(asteroidImage, velocity, position=position)])
		}
	}

	private _removeExpiredUFOs() {
		for (let i = 0; i < this.ufos.length; i ++) {
			const ufo = this.ufos[i]
			if (ufo.lifeSeconds <= 0) {
				this.ufos.splice(i, 1)
				break
			}
		}
	}

	private _replenishUFOS() {
		if (this.ufos.length < this.config.ufoConfig.maximumCount) {
			const randomNumber = Math.random()
			if (randomNumber < 0.005) {
				let position: p5.Vector
				while (!position || p5.Vector.dist(position, this.ship.position) < (this.ship.height + UFO_HEIGHT + 10)) {
					position = createVector(random(0, width), random(0, height))
				}
				let ufoType: UFOType = 'NORMAL'
				if (this.score >= this.nextUpgradeUFO) {
					this.nextUpgradeUFO += this.config.ufoConfig.ufoUpgradeScoreEvery
					ufoType = 'UPGRADE'
				}
				this.ufos.push(
					new UFO(
						this.config.ufoConfig,
						ufoImage.width / ufoImage.height * UFO_HEIGHT,
						UFO_HEIGHT,
						ufoType,
						position,
					)
				)
				ufoSound.play()
			}
		}
	}

	private _addAsteroids(asteroids: Asteroid[]) {
		this.asteroids.push(...asteroids)
	}

	private _removeLaser(laserIndex: number) {
		this.ship.lasers.splice(laserIndex, 1)
	}
	
	private _removeUFOLaser(ufoIndex: number, laserIndex: number) {
		this.ufos[ufoIndex].lasers.splice(laserIndex, 1)
	}

	private _addExplosion(position: p5.Vector, speed: number, radius: number) {
		this.explosions.push(new Explosion(
			position,
			speed,
			createVector(radius, radius),
			explosionImages
		))
	}

	private _removeOffScreenLasers() {
		this.ship.lasers = this.ship.lasers.filter(laser => !laser.offscreen())
		this.ufos.forEach(ufo => {
			ufo.lasers = ufo.lasers.filter(laser => !laser.offscreen())
		})
	}
	private _removeOldExplosions() {
		this.explosions = this.explosions.filter(explosion => explosion.getFrame() <= explosionLength)
	}
}


function collideLaserUFO(laser: Laser, ufo: UFO): boolean {
    return p5.Vector.dist(laser.position, ufo.position) <= (ufo.width + laser.radius)
}

function collideLaserAsteroid(laser: Laser, asteroid: Asteroid): boolean {
    return p5.Vector.dist(laser.position, asteroid.position) <= (asteroid.radius + laser.radius)
}

function collideLaserShip(laser: Laser, ship: Ship): boolean {
    return p5.Vector.dist(laser.position, ship.position) <= (ship.width + laser.radius)
}

function collideShipAsteroid(ship: Ship, asteroid: Asteroid): boolean {
    return p5.Vector.dist(ship.position, asteroid.position) <= (ship.width + asteroid.radius * 0.5)
}

function collideShipUFO(ship: Ship, ufo: UFO): boolean {
    return p5.Vector.dist(ship.position, ufo.position) <= (ship.width + ufo.width * 0.6)
}
