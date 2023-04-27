let backgroundImage: p5.Image;
let shipImage: p5.Image;
let shipWithThrustImage: p5.Image;
let asteroidImage: p5.Image;
let ufoImage: p5.Image;
let ufoUprageImage: p5.Image;
let spriteSheet: p5.Image;
let explosionImages: p5.Image[] = []
let lifeCounterElement: p5.Element
let scoreElement: p5.Element
let highScoreElement: HTMLDivElement
let playerElement: HTMLInputElement
let highScores: HighScore[] = []
let game: Game;
let startNewGameElement: HTMLButtonElement
let difficultyElement: HTMLSelectElement
let highscoreLabel: HTMLDivElement
let laserSound: p5.SoundFile
let ufoSound: HTMLAudioElement
let gameMusic: HTMLAudioElement
let explosionSound: p5.SoundFile
let db: any;


function preload() {
  backgroundImage = loadImage('assets/space-background.jpg')
  shipImage = loadImage('assets/ship_without_thrust.png')
  shipWithThrustImage = loadImage('assets/ship_thrust.png')
  asteroidImage = loadImage('assets/asteroid.png')
  ufoImage = loadImage('assets/UFO.png')
  ufoUprageImage = loadImage('assets/UFO_upgrade.png')
  spriteSheet = loadImage('assets/explosion.png')
  laserSound = loadSound('assets/laser.mp3')
  laserSound.setVolume(0.1)
  ufoSound = new Audio('assets/spaceship-cruising-ufo-7176.mp3')
  ufoSound.volume = 0.7
  ufoSound.loop = true
  gameMusic = new Audio('assets/outer-space-54040.mp3')
  gameMusic.volume = 0.2
  gameMusic.loop = true
  gameMusic.autoplay = true
  explosionSound = loadSound('assets/bad-explosion-6855.mp3')
  explosionSound.setVolume(0.1)
}

function setup() {
  difficultyElement = document.getElementById('difficultyElement') as HTMLSelectElement
  startNewGameElement = document.getElementById('startNewGameButton') as HTMLButtonElement
  startNewGameElement.onclick = startNewGame
  playerElement = document.getElementById('playerName') as HTMLInputElement
  scoreElement = createP().addClass('game-stats').id('score')
  lifeCounterElement = createP().addClass('game-stats').id('lives')
  highscoreLabel = document.getElementById('highScoreLabel') as HTMLDivElement
  highScoreElement = document.getElementById('highscores') as HTMLDivElement

  const drow = spriteSheet.height / spriteRows
  const dcol = spriteSheet.width / spriteCols
  for (let row = 0; row < spriteRows; row ++) {
    for (let col = 0; col < spriteCols; col ++) {
      explosionImages.push(spriteSheet.get(col * dcol, row * drow, dcol, drow))
    }
  }
  for (let row = spriteRows - 1; row >= 0; row --) {
    for (let col = spriteCols - 1; col >= 0; col --) {
      explosionImages.push(spriteSheet.get(col * dcol, row * drow, dcol, drow))
    }
  }

  createCanvas(windowWidth, windowHeight)
  console.log(width, height)
  rectMode(CENTER).noFill().frameRate(30);

  firebase.default.initializeApp(firebaseConfig); 
  db = firebase.default.firestore();
  console.log(firebase)
  console.log(db)
  getHighScores()
  difficultyElement.onchange = getHighScores
}


function newGame(playerName: string, config: GameConfig) {
	return new Game(playerName, config)
}

function startNewGame() {
  console.log('Starting new game')
  console.log(playerElement.value)
	if (playerElement.value.length >= 2) {
    startNewGameElement.hidden = true
    difficultyElement.hidden = true
		playerElement.hidden = true
	  game = newGame(playerElement.value.toString(), CONFIGS[getDifficulty()])
    highscoreLabel.hidden = true
    highScoreElement.innerHTML = ''
    console.log(game)
    game.startGame()
    console.log(game.state)
  }
}

function getDifficulty(): Difficulty {
  return difficultyElement.value as Difficulty ?? 'easy'
}

function setScoreDisplay(score: number) {
  scoreElement.html("Score: " + score.toString())
}
function setLivesDisplay(lives: number) {
  lifeCounterElement.html("Lives: " + lives.toString())
}
function setHighScoreDisplay(highScores: HighScore[]) {
	let html = ''
	highScores.forEach(highScore => {
		html = html.concat("<div class='table-row'>")
		html = html.concat(`<div class='name'>${highScore.name}</div><div class='highScore'>${highScore.score}</div>`)
		html = html.concat("</div>")
	})
  	highScoreElement.innerHTML = html
}

function getHighScores() {
  if (db != undefined) {
    return db.collection(getDifficulty()).orderBy('score', 'desc').limit(10).get().then((snapshot: { docs: any[]; }) => {
      highScores = snapshot.docs.map(doc => doc.data())
    })
  }
  else { highScores = [] }
}

function addHighScore(name: string, score: number) {
  if (db != undefined) {
    db.collection(getDifficulty()).add({
      name: name,
      score: score
    })
  }
  getHighScores()
}

// p5 WILL AUTO RUN THIS FUNCTION IF THE BROWSER WINDOW SIZE CHANGES
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function keyPressed() {
  if (keyCode == 32) {
    game.ship.shoot()
  }
  if (keyCode == ENTER) {
    if (!game) {
      startNewGame()
    }
    if (game.state == 'END') {
      startNewGame()
    }
  }
}
function keyReleased() {
  if (keyCode == 80) {
    if (game.state == 'RUNNING') {
      game.pauseGame()
    }
    else if (game.state == 'PAUSED') {
      game.resumeGame()
    }
  }
}

// p5 WILL HANDLE REQUESTING ANIMATION FRAMES FROM THE BROWSER AND WIL RUN DRAW() EACH ANIMATION FROME
function draw() {
   // CLEAR BACKGROUND
  background(0);
  background(backgroundImage, 0.1)
  if (game) console.log(game.state)
  if (!game || game.state == 'END') {
    playerElement.hidden = false
    highScoreElement.hidden = false
    highscoreLabel.hidden = false
    setHighScoreDisplay(highScores)
  }
  if (game) {
    if (game.lives == 0) {
      if (game.state == 'NEWLIFE' || game.state == 'PAUSED' || game.state == 'RUNNING') {
        addHighScore(game.playerName, game.score)
        game.endGame()
      }
    }
    if (game.state == 'NEWLIFE' && keyIsPressed) {
      highScoreElement.innerHTML = ''
      highscoreLabel.hidden = true
      game.resumeGame()
    }
    if (game.state == 'END') {
      startNewGameElement.hidden = false
      difficultyElement.hidden = false
    }
    if (game.state == 'RUNNING') {
      if (keyIsDown(LEFT_ARROW)) {
        game.rotateShipLeft()
      }
      if (keyIsDown(RIGHT_ARROW)) {
        game.rotateShipRight()
      }
        game.ship.isAccelerating = false
      if (keyIsDown(UP_ARROW)) {
        game.acclerateShipUpwards()
      }
      if (keyIsDown(DOWN_ARROW)) {
        game.acclerateShipDownwards()
      }
      game.checkCollisions()
      game.moveElements()
      game.addRemoveElementsFromGame()
    }
    game.drawElements()

    // CENTER OF SCREEN
    translate(0, 0);

    setScoreDisplay(game.score)
    setLivesDisplay(game.lives)

  }
  

}
