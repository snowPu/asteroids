var FULL_RADIUS = 105;
var HALF_RADIUS = 65;
var types = ['Full', 'Half'];
var Asteroid = (function () {
    function Asteroid(img, velocity, position, type) {
        if (position === void 0) { position = createVector(random(0, width), random(0, height)); }
        if (type === void 0) { type = randomChoice(types); }
        this.position = position;
        this.type = type;
        this.radius = this.type == 'Full' ? FULL_RADIUS : HALF_RADIUS;
        this.img = img;
        this.velocity = velocity;
    }
    Asteroid.prototype._rotate_random = function () {
        this.rotation += random(0, 0.2);
    };
    Asteroid.prototype.setPosition = function (position) {
        this.position = position;
        if (this.position.x > width + this.radius) {
            this.position.x = -this.radius;
        }
        if (this.position.x < -this.radius) {
            this.position.x = width + this.radius;
        }
        if (this.position.y > height + this.radius) {
            this.position.y = -this.radius;
        }
        if (this.position.y < -this.radius) {
            this.position.y = height + this.radius;
        }
    };
    Asteroid.prototype.move = function () {
        push();
        this._rotate_random();
        rotate(this.rotation);
        this.setPosition(this.position.add(this.velocity));
        pop();
    };
    Asteroid.prototype.draw = function () {
        push();
        imageMode(CENTER);
        translate(this.position);
        rotate(this.rotation);
        image(this.img, 0, 0, this.radius, this.radius);
        pop();
    };
    return Asteroid;
}());
function randomChoice(arr) {
    return arr[(Math.random() * arr.length) | 0];
}
var Explosion = (function () {
    function Explosion(position, speed, size, images) {
        this.position = position;
        this.speed = speed;
        this.size = size;
        this.images = images;
        this._index = 0;
        this._frame = 0;
    }
    Explosion.prototype.animate = function () {
        this._frame += 1;
        this._index += this.speed;
    };
    Explosion.prototype.getFrame = function () {
        return this._frame;
    };
    Explosion.prototype.draw = function () {
        push();
        imageMode(CENTER);
        translate(this.position);
        image(this.images[floor(this._index) % this.images.length], 0, 0, this.size.x, this.size.y);
        pop();
    };
    return Explosion;
}());
var Game = (function () {
    function Game(playerName, config) {
        this.playerName = playerName;
        this.config = config;
        this.ship = new Ship(width / 2, height - SHIP_HEIGHT, shipImage.width / shipImage.height * SHIP_HEIGHT, SHIP_HEIGHT, shipImage, shipWithThrustImage);
        this.asteroids = [];
        this._addRandomAsteroids(config.asteroidConfig.initialAsteroidCount);
        this.explosions = [];
        this.ufos = [];
        this.score = 0;
        this.lives = config.lives;
        this.state = 'START';
        this.nextUpgradeUFO = config.ufoConfig.ufoUpgradeScoreEvery;
    }
    Game.prototype.moveElements = function () {
        if (this.state == 'RUNNING') {
            this.ship.move();
            this.asteroids.forEach(function (asteroid) { return asteroid.move(); });
            this.ship.lasers.forEach(function (laser) { return laser.move(); });
        }
        this.explosions.forEach(function (explosion) { return explosion.animate(); });
        this.ufos.forEach(function (ufo) {
            ufo.move();
            ufo.decrementLife();
            ufo.lasers.forEach(function (laser) { return laser.move(); });
        });
    };
    Game.prototype.addRemoveElementsFromGame = function () {
        this._removeOffScreenLasers();
        this._replenishAsteroids();
        this._removeExpiredUFOs();
        this._replenishUFOS();
        var randomNumber = Math.random();
        if (randomNumber < this.config.ufoConfig.shootingProbability)
            this.ufos.forEach(function (ufo) { return ufo.shoot(); });
    };
    Game.prototype.drawElements = function () {
        if (this.state != 'END') {
            this.ship.draw();
            this.asteroids.forEach(function (asteroid) { return asteroid.draw(); });
            this.ship.lasers.forEach(function (laser) { return laser.draw(); });
        }
        this._removeOldExplosions();
        this.explosions.forEach(function (explosion) { return explosion.draw(); });
        this.ufos.forEach(function (ufo) {
            ufo.draw();
            ufo.lasers.forEach(function (laser) { return laser.draw(); });
        });
    };
    Game.prototype.rotateShipLeft = function () {
        this.ship.rotate_left();
    };
    Game.prototype.rotateShipRight = function () {
        this.ship.rotate_right();
    };
    Game.prototype.acclerateShipUpwards = function () {
        this.ship.isAccelerating = true;
        this.ship.accelerate(D_ACCELERATION);
    };
    Game.prototype.acclerateShipDownwards = function () {
        this.ship.isAccelerating = true;
        this.ship.accelerate(-D_ACCELERATION);
    };
    Game.prototype.decelerateShip = function () {
        this.ship.decelerate();
    };
    Game.prototype.newLife = function () {
        this.ship.setPosition(createVector(width / 2, height - SHIP_HEIGHT));
        this.ship.setVelocity(createVector(0, 0));
        this.ship.setRotation(0);
        this.state = 'NEWLIFE';
        this.lives--;
    };
    Game.prototype.incrementScore = function (by) {
        if (by === void 0) { by = 1; }
        this.score += by;
    };
    Game.prototype.startGame = function () {
        this.state = 'RUNNING';
    };
    Game.prototype.resumeGame = function () {
        this.state = 'RUNNING';
    };
    Game.prototype.pauseGame = function () {
        this.state = 'PAUSED';
    };
    Game.prototype.endGame = function () {
        this.state = 'END';
        ufoSound.pause();
    };
    Game.prototype.checkCollisions = function () {
        if (this.state == 'RUNNING') {
            this._checkAsteroidsShipCollisions();
            this._checkAsteroidsLaserCollision();
            this._checkUFOCollisions();
            this._checkShipLaserCollision();
        }
    };
    Game.prototype._checkUFOCollisions = function () {
        var ufoIdx;
        var laserIdx;
        for (ufoIdx = 0; ufoIdx < this.ufos.length; ufoIdx++) {
            if (this._collideShipUFO(ufoIdx)) {
                break;
            }
            for (laserIdx = 0; laserIdx < this.ship.lasers.length; laserIdx++) {
                if (this._collideLaserUFO(laserIdx, ufoIdx)) {
                    break;
                }
            }
        }
    };
    Game.prototype._checkShipLaserCollision = function () {
        var ufoIdx;
        for (ufoIdx = 0; ufoIdx < this.ufos.length; ufoIdx++) {
            var laserIdx = void 0;
            for (laserIdx = 0; laserIdx < this.ufos[ufoIdx].lasers.length; laserIdx++) {
                if (this._collideShipUFOLaser(ufoIdx, laserIdx)) {
                    break;
                }
            }
        }
    };
    Game.prototype._checkAsteroidsShipCollisions = function () {
        var asteroidIdx;
        for (asteroidIdx = 0; asteroidIdx < this.asteroids.length; asteroidIdx++) {
            if (this._collideShipAsteroid(asteroidIdx)) {
                break;
            }
        }
    };
    Game.prototype._checkAsteroidsLaserCollision = function () {
        var laserIdx;
        var asteroidIdx;
        for (asteroidIdx = 0; asteroidIdx < this.asteroids.length; asteroidIdx++) {
            for (laserIdx = 0; laserIdx < this.ship.lasers.length; laserIdx++) {
                if (this._collideLaserAsteroid(laserIdx, asteroidIdx)) {
                    break;
                }
            }
        }
    };
    Game.prototype._collideLaserUFO = function (laserIdx, ufoIdx) {
        var laser = this.ship.lasers[laserIdx];
        var ufo = this.ufos[ufoIdx];
        if (collideLaserUFO(laser, ufo)) {
            explosionSound.play();
            this.incrementScore(5);
            this._removeLaser(laserIdx);
            this._removeUFO(ufoIdx);
            this._addExplosion(ufo.position.copy(), 1.5, ufo.height);
            if (ufo.type == 'UPGRADE')
                this.lives++;
            if (this.ufos.length == 0) {
                ufoSound.pause();
            }
            return true;
        }
        return false;
    };
    Game.prototype._collideLaserAsteroid = function (laserIdx, asteroidIdx) {
        var laser = this.ship.lasers[laserIdx];
        var asteroid = this.asteroids[asteroidIdx];
        if (collideLaserAsteroid(laser, asteroid)) {
            explosionSound.play();
            this.incrementScore();
            this._removeLaser(laserIdx);
            this._removeAsteroid(asteroidIdx);
            if (asteroid.type == 'Full') {
                this._addAsteroids([
                    new Asteroid(asteroidImage, createVector(-asteroid.velocity.x, -asteroid.velocity.y), asteroid.position.copy(), 'Half'),
                    new Asteroid(asteroidImage, createVector(asteroid.velocity.x, asteroid.velocity.y), asteroid.position.copy(), 'Half')
                ]);
            }
            else {
                this._addExplosion(asteroid.position.copy(), 1.5, asteroid.radius);
            }
            return true;
        }
        return false;
    };
    Game.prototype._collideShipUFOLaser = function (ufoIdx, laserIdx) {
        var laser = this.ufos[ufoIdx].lasers[laserIdx];
        if (collideLaserShip(laser, this.ship)) {
            explosionSound.play();
            this._addExplosion(this.ship.position.copy(), 3, this.ship.height);
            this._removeUFOLaser(ufoIdx, laserIdx);
            this.newLife();
            return true;
        }
        return false;
    };
    Game.prototype._collideShipAsteroid = function (asteroidIdx) {
        var asteroid = this.asteroids[asteroidIdx];
        if (collideShipAsteroid(this.ship, asteroid)) {
            explosionSound.play();
            this._addExplosion(this.ship.position.copy(), 3, this.ship.height);
            this._removeAsteroid(asteroidIdx);
            this.newLife();
            return true;
        }
        return false;
    };
    Game.prototype._collideShipUFO = function (ufoIdx) {
        var ufo = this.ufos[ufoIdx];
        if (collideShipUFO(this.ship, ufo)) {
            explosionSound.play();
            this._addExplosion(this.ship.position.copy(), 3, this.ship.height);
            this._removeUFO(ufoIdx);
            this.newLife();
            return true;
        }
        return false;
    };
    Game.prototype._removeAsteroid = function (asteroidIndex) {
        this.asteroids.splice(asteroidIndex, 1);
    };
    Game.prototype._removeUFO = function (ufoIndex) {
        this.ufos.splice(ufoIndex, 1);
    };
    Game.prototype._replenishAsteroids = function () {
        if (this.asteroids.length < this.config.asteroidConfig.minimumCount) {
            this._addRandomAsteroids(this.config.asteroidConfig.asteroidReplenishCount);
        }
    };
    Game.prototype._addRandomAsteroids = function (count) {
        for (var i = 0; i < count; i++) {
            var position = void 0;
            while (!position || p5.Vector.dist(position, this.ship.position) < (this.ship.height + FULL_RADIUS + 10)) {
                position = createVector(random(0, width), random(0, height));
            }
            console.log(this.config);
            var velocity = createVector(random(-this.config.asteroidConfig.maxVelocity, this.config.asteroidConfig.maxVelocity), random(-this.config.asteroidConfig.maxVelocity, this.config.asteroidConfig.maxVelocity));
            this._addAsteroids([new Asteroid(asteroidImage, velocity, position = position)]);
        }
    };
    Game.prototype._removeExpiredUFOs = function () {
        for (var i = 0; i < this.ufos.length; i++) {
            var ufo = this.ufos[i];
            if (ufo.lifeSeconds <= 0) {
                this.ufos.splice(i, 1);
                break;
            }
        }
    };
    Game.prototype._replenishUFOS = function () {
        if (this.ufos.length < this.config.ufoConfig.maximumCount) {
            var randomNumber = Math.random();
            if (randomNumber < 0.005) {
                var position = void 0;
                while (!position || p5.Vector.dist(position, this.ship.position) < (this.ship.height + UFO_HEIGHT + 10)) {
                    position = createVector(random(0, width), random(0, height));
                }
                var ufoType = 'NORMAL';
                if (this.score >= this.nextUpgradeUFO) {
                    this.nextUpgradeUFO += this.config.ufoConfig.ufoUpgradeScoreEvery;
                    ufoType = 'UPGRADE';
                }
                this.ufos.push(new UFO(this.config.ufoConfig, ufoImage.width / ufoImage.height * UFO_HEIGHT, UFO_HEIGHT, ufoType, position));
                ufoSound.play();
            }
        }
    };
    Game.prototype._addAsteroids = function (asteroids) {
        var _a;
        (_a = this.asteroids).push.apply(_a, asteroids);
    };
    Game.prototype._removeLaser = function (laserIndex) {
        this.ship.lasers.splice(laserIndex, 1);
    };
    Game.prototype._removeUFOLaser = function (ufoIndex, laserIndex) {
        this.ufos[ufoIndex].lasers.splice(laserIndex, 1);
    };
    Game.prototype._addExplosion = function (position, speed, radius) {
        this.explosions.push(new Explosion(position, speed, createVector(radius, radius), explosionImages));
    };
    Game.prototype._removeOffScreenLasers = function () {
        this.ship.lasers = this.ship.lasers.filter(function (laser) { return !laser.offscreen(); });
        this.ufos.forEach(function (ufo) {
            ufo.lasers = ufo.lasers.filter(function (laser) { return !laser.offscreen(); });
        });
    };
    Game.prototype._removeOldExplosions = function () {
        this.explosions = this.explosions.filter(function (explosion) { return explosion.getFrame() <= explosionLength; });
    };
    return Game;
}());
function collideLaserUFO(laser, ufo) {
    return p5.Vector.dist(laser.position, ufo.position) <= (ufo.width + laser.radius);
}
function collideLaserAsteroid(laser, asteroid) {
    return p5.Vector.dist(laser.position, asteroid.position) <= (asteroid.radius + laser.radius);
}
function collideLaserShip(laser, ship) {
    return p5.Vector.dist(laser.position, ship.position) <= (ship.width + laser.radius);
}
function collideShipAsteroid(ship, asteroid) {
    return p5.Vector.dist(ship.position, asteroid.position) <= (ship.width + asteroid.radius * 0.5);
}
function collideShipUFO(ship, ufo) {
    return p5.Vector.dist(ship.position, ufo.position) <= (ship.width + ufo.width * 0.6);
}
var Laser = (function () {
    function Laser(position, velocity, color) {
        if (color === void 0) { color = {
            r: random(100, 255),
            g: random(100, 255),
            b: random(100, 255),
        }; }
        this.position = position;
        this.radius = 5;
        this.velocity = velocity;
        this.color = color;
    }
    Laser.prototype.setPosition = function (position) {
        this.position = position;
    };
    Laser.prototype.offscreen = function () {
        return (this.position.x > width || this.position.x < 0 || this.position.y > height || this.position.y < 0);
    };
    ;
    Laser.prototype.move = function () {
        push();
        this.setPosition(this.position.add(this.velocity));
        pop();
    };
    Laser.prototype.draw = function () {
        push();
        imageMode(CENTER);
        translate(this.position);
        fill(this.color.r, this.color.g, this.color.b);
        circle(0, 0, this.radius * 2);
        pop();
    };
    return Laser;
}());
var Ship = (function () {
    function Ship(x, y, width, height, img, thrustImg, velocity) {
        if (velocity === void 0) { velocity = createVector(0, 0); }
        this.position = createVector(x, y);
        this.width = width;
        this.height = height;
        this.img = img;
        this.thrustImg = thrustImg;
        this.velocity = velocity;
        this.maxVelocity = 10;
        this.rotation = 0;
        this.isAccelerating = false;
        this.lasers = [];
    }
    Ship.prototype.rotate_left = function () {
        this.rotation -= 0.1;
    };
    Ship.prototype.rotate_right = function () {
        this.rotation += 0.1;
    };
    Ship.prototype.setRotation = function (rotation) {
        this.rotation = rotation;
    };
    Ship.prototype.setVelocity = function (velocity) {
        this.velocity = velocity.limit(this.maxVelocity);
    };
    Ship.prototype.accelerate = function (d_velocity) {
        var force = p5.Vector.fromAngle(this.rotation - PI / 2);
        force.mult(d_velocity);
        this.setVelocity(this.velocity.add(force));
    };
    Ship.prototype.decelerate = function () {
        this.velocity = this.velocity.mult(0.99);
    };
    Ship.prototype.move = function () {
        push();
        this.setPosition(this.position.add(this.velocity));
        pop();
    };
    Ship.prototype.shoot = function () {
        laserSound.play();
        this.lasers.push(new Laser(p5.Vector.add(this.position.copy(), p5.Vector.fromAngle(this.rotation - PI / 2).mult(this.height / 2)), p5.Vector.fromAngle(this.rotation - PI / 2).mult(30)));
    };
    Ship.prototype.setPosition = function (position) {
        this.position = position;
        if (this.position.x > width + this.height) {
            this.position.x = -this.height;
        }
        if (this.position.x < -this.height) {
            this.position.x = width + this.height;
        }
        if (this.position.y > height + this.height) {
            this.position.y = -this.height;
        }
        if (this.position.y < -this.height) {
            this.position.y = height + this.height;
        }
    };
    Ship.prototype.draw = function () {
        push();
        imageMode(CENTER);
        translate(this.position);
        rotate(this.rotation);
        if (this.isAccelerating) {
            image(this.thrustImg, 0, 0, this.width, this.height);
        }
        else {
            image(this.img, 0, 0, this.width, this.height);
        }
        pop();
    };
    return Ship;
}());
var UFO = (function () {
    function UFO(config, width, height, type, position, velocity) {
        if (position === void 0) { position = createVector(random(0, width), random(0, height)); }
        if (velocity === void 0) { velocity = createVector(random(-config.maxVelocity, config.maxVelocity), random(-config.maxVelocity, config.maxVelocity)); }
        this.config = config;
        this.position = position;
        this.width = width;
        this.height = height;
        this.velocity = velocity;
        this.maxVelocity = 10;
        this.rotation = random(-0.5, 0.5);
        this.lasers = [];
        this.type = type;
        if (this.type == 'NORMAL') {
            this.img = ufoImage;
            this.lifeSeconds = undefined;
        }
        else {
            this.img = ufoUprageImage;
            this.lifeSeconds = config.ufoUpgradeLifetimeSeconds;
        }
    }
    UFO.prototype.rotate_left = function () {
        this.rotation -= 0.05;
    };
    UFO.prototype.rotate_right = function () {
        this.rotation += 0.05;
    };
    UFO.prototype.setRotation = function (rotation) {
        this.rotation = rotation;
    };
    UFO.prototype.setVelocity = function (velocity) {
        this.velocity = velocity.limit(this.maxVelocity);
    };
    UFO.prototype.accelerate = function (d_velocity) {
        var force = p5.Vector.fromAngle(this.rotation - PI / 2);
        force.mult(d_velocity);
        this.setVelocity(this.velocity.add(force));
    };
    UFO.prototype.decelerate = function () {
        this.velocity = this.velocity.mult(0.99);
    };
    UFO.prototype._rotate_random = function () {
        this.rotation += random(0, 0.05);
    };
    UFO.prototype.move = function () {
        push();
        this._rotate_random();
        this.setPosition(this.position.add(this.velocity));
        pop();
    };
    UFO.prototype.decrementLife = function () {
        if (this.lifeSeconds !== undefined && frameCount % 30 == 0) {
            this.lifeSeconds -= 1;
        }
    };
    UFO.prototype.shoot = function () {
        this.lasers.push(new Laser(p5.Vector.add(this.position.copy(), p5.Vector.fromAngle(this.rotation - PI / 2).mult(this.height / 2)), p5.Vector.fromAngle(this.rotation - PI / 2).mult(10), {
            r: 200,
            g: 0,
            b: 0,
        }));
    };
    UFO.prototype.setPosition = function (position) {
        this.position = position;
        if (this.position.x > width + this.height) {
            this.position.x = -this.height;
        }
        if (this.position.x < -this.height) {
            this.position.x = width + this.height;
        }
        if (this.position.y > height + this.height) {
            this.position.y = -this.height;
        }
        if (this.position.y < -this.height) {
            this.position.y = height + this.height;
        }
    };
    UFO.prototype.draw = function () {
        push();
        imageMode(CENTER);
        translate(this.position);
        rotate(this.rotation);
        image(this.img, 0, 0, this.width, this.height);
        if (this.lifeSeconds !== undefined) {
            translate(0, SHIP_HEIGHT * 0.7);
            noStroke();
            fill(255, 225, 117);
            circle(0, 0, 35);
            textAlign(CENTER, CENTER);
            textSize(24);
            fill(0, 0, 0);
            text(Math.ceil(this.lifeSeconds), 0, 0);
        }
        pop();
    };
    return UFO;
}());
var easy = {
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
};
var medium = {
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
};
var hard = {
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
};
var spriteRows = 4;
var spriteCols = 4;
var spriteRow = 3;
var D_ACCELERATION = 2;
var explosionLength = 40;
var SHIP_HEIGHT = 70;
var UFO_HEIGHT = 80;
var HIGH_SCORES = 'HIGH_SCORES';
var NO_OF_HIGH_SCORES = 10;
var CONFIGS = {
    'easy': easy,
    'medium': medium,
    'hard': hard,
};
var backgroundImage;
var shipImage;
var shipWithThrustImage;
var asteroidImage;
var ufoImage;
var ufoUprageImage;
var spriteSheet;
var explosionImages = [];
var lifeCounterElement;
var scoreElement;
var highScoreElement;
var playerElement;
var highScores = {
    easy: [], medium: [], hard: []
};
var game;
var startNewGameElement;
var difficultyElement;
var highscoreLabel;
var laserSound;
var ufoSound;
var gameMusic;
var explosionSound;
function preload() {
    backgroundImage = loadImage('assets/space-background.jpg');
    shipImage = loadImage('assets/ship_without_thrust.png');
    shipWithThrustImage = loadImage('assets/ship_thrust.png');
    asteroidImage = loadImage('assets/asteroid.png');
    ufoImage = loadImage('assets/UFO.png');
    ufoUprageImage = loadImage('assets/UFO_upgrade.png');
    spriteSheet = loadImage('assets/explosion.png');
    laserSound = loadSound('assets/laser.mp3');
    laserSound.setVolume(0.1);
    ufoSound = new Audio('assets/spaceship-cruising-ufo-7176.mp3');
    ufoSound.volume = 0.7;
    ufoSound.loop = true;
    gameMusic = new Audio('assets/outer-space-54040.mp3');
    gameMusic.volume = 0.2;
    gameMusic.loop = true;
    gameMusic.autoplay = true;
    explosionSound = loadSound('assets/bad-explosion-6855.mp3');
    explosionSound.setVolume(0.1);
}
function setup() {
    highScores = getLocalHighScores();
    difficultyElement = document.getElementById('difficultyElement');
    startNewGameElement = document.getElementById('startNewGameButton');
    startNewGameElement.onclick = startNewGame;
    playerElement = document.getElementById('playerName');
    scoreElement = createP().addClass('game-stats').id('score');
    lifeCounterElement = createP().addClass('game-stats').id('lives');
    highscoreLabel = document.getElementById('highScoreLabel');
    highScoreElement = document.getElementById('highscores');
    var drow = spriteSheet.height / spriteRows;
    var dcol = spriteSheet.width / spriteCols;
    for (var row = 0; row < spriteRows; row++) {
        for (var col = 0; col < spriteCols; col++) {
            explosionImages.push(spriteSheet.get(col * dcol, row * drow, dcol, drow));
        }
    }
    for (var row = spriteRows - 1; row >= 0; row--) {
        for (var col = spriteCols - 1; col >= 0; col--) {
            explosionImages.push(spriteSheet.get(col * dcol, row * drow, dcol, drow));
        }
    }
    createCanvas(windowWidth, windowHeight);
    console.log(width, height);
    rectMode(CENTER).noFill().frameRate(30);
}
function newGame(playerName, config) {
    return new Game(playerName, config);
}
function startNewGame() {
    console.log('Starting new game');
    console.log(playerElement.value);
    if (playerElement.value.length >= 2) {
        startNewGameElement.hidden = true;
        difficultyElement.hidden = true;
        playerElement.hidden = true;
        game = newGame(playerElement.value.toString(), CONFIGS[getDifficulty()]);
        highscoreLabel.hidden = true;
        highScoreElement.innerHTML = '';
        console.log(game);
        game.startGame();
        console.log(game.state);
    }
}
function getDifficulty() {
    var _a;
    return (_a = difficultyElement.value) !== null && _a !== void 0 ? _a : 'easy';
}
function setScoreDisplay(score) {
    scoreElement.html("Score: " + score.toString());
}
function setLivesDisplay(lives) {
    lifeCounterElement.html("Lives: " + lives.toString());
}
function setHighScoreDisplay(difficulty, highScores) {
    var html = '';
    highScores[difficulty].forEach(function (highScore) {
        html = html.concat("<div class='table-row'>");
        html = html.concat("<div class='name'>".concat(highScore.name, "</div><div class='highScore'>").concat(highScore.score, "</div>"));
        html = html.concat("</div>");
    });
    highScoreElement.innerHTML = html;
}
function getLocalHighScores() {
    var _a;
    var highScoreString = localStorage.getItem(HIGH_SCORES);
    return (_a = JSON.parse(highScoreString)) !== null && _a !== void 0 ? _a : [];
}
function setLocalHighScores(highScores) {
    localStorage.setItem(HIGH_SCORES, JSON.stringify(highScores));
}
function isHighScore(difficulty, score) {
    var _a, _b;
    var lowestScore = (_b = (_a = highScores[difficulty][NO_OF_HIGH_SCORES - 1]) === null || _a === void 0 ? void 0 : _a.score) !== null && _b !== void 0 ? _b : 0;
    return (score > lowestScore);
}
function addHighScore(difficulty, name, score) {
    if (isHighScore) {
        highScores[difficulty].push({ name: name, score: score });
        highScores[difficulty].sort(function (a, b) { return b.score - a.score; });
        highScores[difficulty].splice(NO_OF_HIGH_SCORES);
        setLocalHighScores(highScores);
    }
}
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
function keyPressed() {
    if (keyCode == 32) {
        game.ship.shoot();
    }
    if (keyCode == ENTER) {
        if (!game) {
            startNewGame();
        }
        if (game.state == 'END') {
            startNewGame();
        }
    }
}
function keyReleased() {
    if (keyCode == 80) {
        if (game.state == 'RUNNING') {
            game.pauseGame();
        }
        else if (game.state == 'PAUSED') {
            game.resumeGame();
        }
    }
}
function draw() {
    background(0);
    background(backgroundImage, 0.1);
    if (game)
        console.log(game.state);
    if (!game || game.state == 'END') {
        playerElement.hidden = false;
        highScoreElement.hidden = false;
        highscoreLabel.hidden = false;
        setHighScoreDisplay(getDifficulty(), highScores);
    }
    if (game) {
        if (game.lives == 0) {
            if (game.state == 'NEWLIFE' || game.state == 'PAUSED' || game.state == 'RUNNING') {
                addHighScore(getDifficulty(), game.playerName, game.score);
                game.endGame();
            }
        }
        if (game.state == 'NEWLIFE' && keyIsPressed) {
            highScoreElement.innerHTML = '';
            highscoreLabel.hidden = true;
            game.resumeGame();
        }
        if (game.state == 'END') {
            startNewGameElement.hidden = false;
            difficultyElement.hidden = false;
        }
        if (game.state == 'RUNNING') {
            if (keyIsDown(LEFT_ARROW)) {
                game.rotateShipLeft();
            }
            if (keyIsDown(RIGHT_ARROW)) {
                game.rotateShipRight();
            }
            game.ship.isAccelerating = false;
            if (keyIsDown(UP_ARROW)) {
                game.acclerateShipUpwards();
            }
            if (keyIsDown(DOWN_ARROW)) {
                game.acclerateShipDownwards();
            }
            game.checkCollisions();
            game.moveElements();
            game.addRemoveElementsFromGame();
        }
        game.drawElements();
        translate(0, 0);
        setScoreDisplay(game.score);
        setLivesDisplay(game.lives);
    }
}