const FULL_RADIUS = 105;
const HALF_RADIUS = 65;
let types = ['Full', 'Half'];
class Asteroid {
    constructor(img, velocity, position = createVector(random(0, width), random(0, height)), type = randomChoice(types)) {
        this.position = position;
        this.type = type;
        this.radius = this.type == 'Full' ? FULL_RADIUS : HALF_RADIUS;
        this.img = img;
        this.velocity = velocity;
    }
    _rotate_random() {
        this.rotation += random(0, 0.2);
    }
    setPosition(position) {
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
    }
    move() {
        push();
        this._rotate_random();
        rotate(this.rotation);
        this.setPosition(this.position.add(this.velocity));
        pop();
    }
    draw() {
        push();
        imageMode(CENTER);
        translate(this.position);
        rotate(this.rotation);
        image(this.img, 0, 0, this.radius, this.radius);
        pop();
    }
}
function randomChoice(arr) {
    return arr[(Math.random() * arr.length) | 0];
}
class Explosion {
    constructor(position, speed, size, images) {
        this.position = position;
        this.speed = speed;
        this.size = size;
        this.images = images;
        this._index = 0;
        this._frame = 0;
    }
    animate() {
        this._frame += 1;
        this._index += this.speed;
    }
    getFrame() {
        return this._frame;
    }
    draw() {
        push();
        imageMode(CENTER);
        translate(this.position);
        image(this.images[floor(this._index) % this.images.length], 0, 0, this.size.x, this.size.y);
        pop();
    }
}
class Game {
    constructor(playerName, config) {
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
    moveElements() {
        if (this.state == 'RUNNING') {
            this.ship.move();
            this.asteroids.forEach(asteroid => asteroid.move());
            this.ship.lasers.forEach(laser => laser.move());
        }
        this.explosions.forEach(explosion => explosion.animate());
        this.ufos.forEach(ufo => {
            ufo.move();
            ufo.decrementLife();
            ufo.lasers.forEach(laser => laser.move());
        });
    }
    addRemoveElementsFromGame() {
        this._removeOffScreenLasers();
        this._replenishAsteroids();
        this._removeExpiredUFOs();
        this._replenishUFOS();
        const randomNumber = Math.random();
        if (randomNumber < this.config.ufoConfig.shootingProbability)
            this.ufos.forEach(ufo => ufo.shoot());
    }
    drawElements() {
        if (this.state != 'END') {
            this.ship.draw();
            this.asteroids.forEach(asteroid => asteroid.draw());
            this.ship.lasers.forEach(laser => laser.draw());
        }
        this._removeOldExplosions();
        this.explosions.forEach(explosion => explosion.draw());
        this.ufos.forEach(ufo => {
            ufo.draw();
            ufo.lasers.forEach(laser => laser.draw());
        });
    }
    rotateShipLeft() {
        this.ship.rotate_left();
    }
    rotateShipRight() {
        this.ship.rotate_right();
    }
    acclerateShipUpwards() {
        this.ship.isAccelerating = true;
        this.ship.accelerate(D_ACCELERATION);
    }
    acclerateShipDownwards() {
        this.ship.isAccelerating = true;
        this.ship.accelerate(-D_ACCELERATION);
    }
    decelerateShip() {
        this.ship.decelerate();
    }
    newLife() {
        this.ship.setPosition(createVector(width / 2, height - SHIP_HEIGHT));
        this.ship.setVelocity(createVector(0, 0));
        this.ship.setRotation(0);
        this.state = 'NEWLIFE';
        this.lives--;
    }
    incrementScore(by = 1) {
        this.score += by;
    }
    startGame() {
        this.state = 'RUNNING';
    }
    resumeGame() {
        this.state = 'RUNNING';
    }
    pauseGame() {
        this.state = 'PAUSED';
    }
    endGame() {
        this.state = 'END';
        ufoSound.pause();
    }
    checkCollisions() {
        if (this.state == 'RUNNING') {
            this._checkAsteroidsShipCollisions();
            this._checkAsteroidsLaserCollision();
            this._checkUFOCollisions();
            this._checkShipLaserCollision();
        }
    }
    _checkUFOCollisions() {
        let ufoIdx;
        let laserIdx;
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
    }
    _checkShipLaserCollision() {
        let ufoIdx;
        for (ufoIdx = 0; ufoIdx < this.ufos.length; ufoIdx++) {
            let laserIdx;
            for (laserIdx = 0; laserIdx < this.ufos[ufoIdx].lasers.length; laserIdx++) {
                if (this._collideShipUFOLaser(ufoIdx, laserIdx)) {
                    break;
                }
            }
        }
    }
    _checkAsteroidsShipCollisions() {
        let asteroidIdx;
        for (asteroidIdx = 0; asteroidIdx < this.asteroids.length; asteroidIdx++) {
            if (this._collideShipAsteroid(asteroidIdx)) {
                break;
            }
        }
    }
    _checkAsteroidsLaserCollision() {
        let laserIdx;
        let asteroidIdx;
        for (asteroidIdx = 0; asteroidIdx < this.asteroids.length; asteroidIdx++) {
            for (laserIdx = 0; laserIdx < this.ship.lasers.length; laserIdx++) {
                if (this._collideLaserAsteroid(laserIdx, asteroidIdx)) {
                    break;
                }
            }
        }
    }
    _collideLaserUFO(laserIdx, ufoIdx) {
        const laser = this.ship.lasers[laserIdx];
        const ufo = this.ufos[ufoIdx];
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
    }
    _collideLaserAsteroid(laserIdx, asteroidIdx) {
        const laser = this.ship.lasers[laserIdx];
        const asteroid = this.asteroids[asteroidIdx];
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
    }
    _collideShipUFOLaser(ufoIdx, laserIdx) {
        const laser = this.ufos[ufoIdx].lasers[laserIdx];
        if (collideLaserShip(laser, this.ship)) {
            explosionSound.play();
            this._addExplosion(this.ship.position.copy(), 3, this.ship.height);
            this._removeUFOLaser(ufoIdx, laserIdx);
            this.newLife();
            return true;
        }
        return false;
    }
    _collideShipAsteroid(asteroidIdx) {
        const asteroid = this.asteroids[asteroidIdx];
        if (collideShipAsteroid(this.ship, asteroid)) {
            explosionSound.play();
            this._addExplosion(this.ship.position.copy(), 3, this.ship.height);
            this._removeAsteroid(asteroidIdx);
            this.newLife();
            return true;
        }
        return false;
    }
    _collideShipUFO(ufoIdx) {
        const ufo = this.ufos[ufoIdx];
        if (collideShipUFO(this.ship, ufo)) {
            explosionSound.play();
            this._addExplosion(this.ship.position.copy(), 3, this.ship.height);
            this._removeUFO(ufoIdx);
            this.newLife();
            return true;
        }
        return false;
    }
    _removeAsteroid(asteroidIndex) {
        this.asteroids.splice(asteroidIndex, 1);
    }
    _removeUFO(ufoIndex) {
        this.ufos.splice(ufoIndex, 1);
    }
    _replenishAsteroids() {
        if (this.asteroids.length < this.config.asteroidConfig.minimumCount) {
            this._addRandomAsteroids(this.config.asteroidConfig.asteroidReplenishCount);
        }
    }
    _addRandomAsteroids(count) {
        for (let i = 0; i < count; i++) {
            let position;
            while (!position || p5.Vector.dist(position, this.ship.position) < (this.ship.height + FULL_RADIUS + 10)) {
                position = createVector(random(0, width), random(0, height));
            }
            console.log(this.config);
            const velocity = createVector(random(-this.config.asteroidConfig.maxVelocity, this.config.asteroidConfig.maxVelocity), random(-this.config.asteroidConfig.maxVelocity, this.config.asteroidConfig.maxVelocity));
            this._addAsteroids([new Asteroid(asteroidImage, velocity, position = position)]);
        }
    }
    _removeExpiredUFOs() {
        for (let i = 0; i < this.ufos.length; i++) {
            const ufo = this.ufos[i];
            if (ufo.lifeSeconds <= 0) {
                this.ufos.splice(i, 1);
                break;
            }
        }
    }
    _replenishUFOS() {
        if (this.ufos.length < this.config.ufoConfig.maximumCount) {
            const randomNumber = Math.random();
            if (randomNumber < 0.005) {
                let position;
                while (!position || p5.Vector.dist(position, this.ship.position) < (this.ship.height + UFO_HEIGHT + 10)) {
                    position = createVector(random(0, width), random(0, height));
                }
                let ufoType = 'NORMAL';
                if (this.score >= this.nextUpgradeUFO) {
                    this.nextUpgradeUFO += this.config.ufoConfig.ufoUpgradeScoreEvery;
                    ufoType = 'UPGRADE';
                }
                this.ufos.push(new UFO(this.config.ufoConfig, ufoImage.width / ufoImage.height * UFO_HEIGHT, UFO_HEIGHT, ufoType, position));
                ufoSound.play();
            }
        }
    }
    _addAsteroids(asteroids) {
        this.asteroids.push(...asteroids);
    }
    _removeLaser(laserIndex) {
        this.ship.lasers.splice(laserIndex, 1);
    }
    _removeUFOLaser(ufoIndex, laserIndex) {
        this.ufos[ufoIndex].lasers.splice(laserIndex, 1);
    }
    _addExplosion(position, speed, radius) {
        this.explosions.push(new Explosion(position, speed, createVector(radius, radius), explosionImages));
    }
    _removeOffScreenLasers() {
        this.ship.lasers = this.ship.lasers.filter(laser => !laser.offscreen());
        this.ufos.forEach(ufo => {
            ufo.lasers = ufo.lasers.filter(laser => !laser.offscreen());
        });
    }
    _removeOldExplosions() {
        this.explosions = this.explosions.filter(explosion => explosion.getFrame() <= explosionLength);
    }
}
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
class Laser {
    constructor(position, velocity, color = {
        r: random(100, 255),
        g: random(100, 255),
        b: random(100, 255),
    }) {
        this.position = position;
        this.radius = 5;
        this.velocity = velocity;
        this.color = color;
    }
    setPosition(position) {
        this.position = position;
    }
    offscreen() {
        return (this.position.x > width || this.position.x < 0 || this.position.y > height || this.position.y < 0);
    }
    ;
    move() {
        push();
        this.setPosition(this.position.add(this.velocity));
        pop();
    }
    draw() {
        push();
        imageMode(CENTER);
        translate(this.position);
        fill(this.color.r, this.color.g, this.color.b);
        circle(0, 0, this.radius * 2);
        pop();
    }
}
class Ship {
    constructor(x, y, width, height, img, thrustImg, velocity = createVector(0, 0)) {
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
    rotate_left() {
        this.rotation -= 0.1;
    }
    rotate_right() {
        this.rotation += 0.1;
    }
    setRotation(rotation) {
        this.rotation = rotation;
    }
    setVelocity(velocity) {
        this.velocity = velocity.limit(this.maxVelocity);
    }
    accelerate(d_velocity) {
        let force = p5.Vector.fromAngle(this.rotation - PI / 2);
        force.mult(d_velocity);
        this.setVelocity(this.velocity.add(force));
    }
    decelerate() {
        this.velocity = this.velocity.mult(0.99);
    }
    move() {
        push();
        this.setPosition(this.position.add(this.velocity));
        pop();
    }
    shoot() {
        laserSound.play();
        this.lasers.push(new Laser(p5.Vector.add(this.position.copy(), p5.Vector.fromAngle(this.rotation - PI / 2).mult(this.height / 2)), p5.Vector.fromAngle(this.rotation - PI / 2).mult(30)));
    }
    setPosition(position) {
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
    }
    draw() {
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
    }
}
class UFO {
    constructor(config, width, height, type, position = createVector(random(0, width), random(0, height)), velocity = createVector(random(-config.maxVelocity, config.maxVelocity), random(-config.maxVelocity, config.maxVelocity))) {
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
    rotate_left() {
        this.rotation -= 0.05;
    }
    rotate_right() {
        this.rotation += 0.05;
    }
    setRotation(rotation) {
        this.rotation = rotation;
    }
    setVelocity(velocity) {
        this.velocity = velocity.limit(this.maxVelocity);
    }
    accelerate(d_velocity) {
        let force = p5.Vector.fromAngle(this.rotation - PI / 2);
        force.mult(d_velocity);
        this.setVelocity(this.velocity.add(force));
    }
    decelerate() {
        this.velocity = this.velocity.mult(0.99);
    }
    _rotate_random() {
        this.rotation += random(0, 0.05);
    }
    move() {
        push();
        this._rotate_random();
        this.setPosition(this.position.add(this.velocity));
        pop();
    }
    decrementLife() {
        if (this.lifeSeconds !== undefined && frameCount % 30 == 0) {
            this.lifeSeconds -= 1;
        }
    }
    shoot() {
        this.lasers.push(new Laser(p5.Vector.add(this.position.copy(), p5.Vector.fromAngle(this.rotation - PI / 2).mult(this.height / 2)), p5.Vector.fromAngle(this.rotation - PI / 2).mult(10), {
            r: 200,
            g: 0,
            b: 0,
        }));
    }
    setPosition(position) {
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
    }
    draw() {
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
    }
}
const easy = {
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
const medium = {
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
const hard = {
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
const spriteRows = 4;
const spriteCols = 4;
const spriteRow = 3;
const D_ACCELERATION = 2;
const explosionLength = 40;
const SHIP_HEIGHT = 70;
const UFO_HEIGHT = 80;
const HIGH_SCORES = 'HIGH_SCORES';
const NO_OF_HIGH_SCORES = 10;
const CONFIGS = {
    'easy': easy,
    'medium': medium,
    'hard': hard,
};
const firebaseConfig = {
    apiKey: "AIzaSyAwIHBpQnRrIXLLp4euhVB2K4Gpjas2OTE",
    databaseURL: "https://asteroids-3cfd2.firebaseio.com",
    authDomain: "asteroids-3cfd2.firebaseapp.com",
    projectId: "asteroids-3cfd2",
    storageBucket: "asteroids-3cfd2.appspot.com",
    messagingSenderId: "187496489713",
    appId: "1:187496489713:web:925331849946248527ff50",
    measurementId: "G-XFQ8N96VKB"
};
let backgroundImage;
let shipImage;
let shipWithThrustImage;
let asteroidImage;
let ufoImage;
let ufoUprageImage;
let spriteSheet;
let explosionImages = [];
let lifeCounterElement;
let scoreElement;
let highScoreElement;
let playerElement;
let highScores = [];
let game;
let startNewGameElement;
let difficultyElement;
let highscoreLabel;
let laserSound;
let ufoSound;
let gameMusic;
let explosionSound;
let db;
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
    difficultyElement = document.getElementById('difficultyElement');
    startNewGameElement = document.getElementById('startNewGameButton');
    startNewGameElement.onclick = startNewGame;
    playerElement = document.getElementById('playerName');
    scoreElement = createP().addClass('game-stats').id('score');
    lifeCounterElement = createP().addClass('game-stats').id('lives');
    highscoreLabel = document.getElementById('highScoreLabel');
    highScoreElement = document.getElementById('highscores');
    const drow = spriteSheet.height / spriteRows;
    const dcol = spriteSheet.width / spriteCols;
    for (let row = 0; row < spriteRows; row++) {
        for (let col = 0; col < spriteCols; col++) {
            explosionImages.push(spriteSheet.get(col * dcol, row * drow, dcol, drow));
        }
    }
    for (let row = spriteRows - 1; row >= 0; row--) {
        for (let col = spriteCols - 1; col >= 0; col--) {
            explosionImages.push(spriteSheet.get(col * dcol, row * drow, dcol, drow));
        }
    }
    createCanvas(windowWidth, windowHeight);
    rectMode(CENTER).noFill().frameRate(30);
    firebase.default.initializeApp(firebaseConfig);
    db = firebase.default.firestore();
    getHighScores();
    difficultyElement.onchange = getHighScores;
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
function setHighScoreDisplay(highScores) {
    let html = '';
    highScores.forEach(highScore => {
        html = html.concat("<div class='table-row'>");
        html = html.concat(`<div class='name'>${highScore.name}</div><div class='highScore'>${highScore.score}</div>`);
        html = html.concat("</div>");
    });
    highScoreElement.innerHTML = html;
}
function getHighScores() {
    if (db != undefined) {
        return db.collection(getDifficulty()).orderBy('score', 'desc').limit(10).get().then((snapshot) => {
            highScores = snapshot.docs.map(doc => doc.data());
        });
    }
    else {
        highScores = [];
    }
}
function addHighScore(name, score) {
    if (db != undefined) {
        db.collection(getDifficulty()).add({
            name: name,
            score: score
        });
    }
    getHighScores();
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
        setHighScoreDisplay(highScores);
    }
    if (game) {
        if (game.lives == 0) {
            if (game.state == 'NEWLIFE' || game.state == 'PAUSED' || game.state == 'RUNNING') {
                addHighScore(game.playerName, game.score);
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
//# sourceMappingURL=build.js.map