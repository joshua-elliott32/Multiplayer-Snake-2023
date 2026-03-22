//setup socket connection 
let socket = io();

//constants
let HEIGHT = 500
let WIDTH = 500
let COLOURS = ['orange', 'yellow', 'green', 'blue', 'indigo', 'violet']
let FRAMERATE = 60

//global variables
let game = null

//p5 inputs and buttons
let inp
let playBtn

function setup() {
	//creates canvas
	createCanvas(WIDTH, HEIGHT);

	// set frame rate
	//frameRate(FRAMERATE)

	//listens to server for emits
	socket.on('gamestate', function(data) {
		//gets gamestate sent
		game = data
	});

	createButtons()
	createInputs()

}

function draw() {
	//console.log(socket.id)
	if (game != null && Object.values(game.players).length > 0) {

		let player = game.players[socket.id]

		if(player!=null){
			if (player.alive == true) {
				showGameScreen()
				//console.log(player)
			}
			else if (player.alive == null) {
				showStartScreen()
			}
			else if (player.alive == false) {
				//console.log(player)
				showDeathScreen()
			}
		}
	}
}

function showGameScreen() {
	inp.hide()
	playBtn.hide()
	nextColourBtn.hide()
	prevColourBtn.hide()
	background(80)
	if (game != null) {
		showFoods()
		showSnakes()
	}
}

function drawLeaderboard() {
	push()
	stroke("white")
	fill("white")
	textAlign(LEFT)
	textSize(18)
	text("Leaderboard:",10,30)
	textSize(14)
	scores = Object.values(game.leaderboard)
	let leaderboardSize = scores.length
	if(scores.length>5){
		leaderboardSize = 5
	}

	sortedScores = scores.sort(function(a, b){return b.score - a.score})
	for (let i = 0; i < leaderboardSize; i++) {
		score = Object.values(scores)[i]
		scoreText = (score.name + ": " + score.score)
		//console.log(scoreText)
		text(scoreText, 10, 50 + i*20)
	}	
	pop()
}

function showStartScreen() {
	let player = game.players[socket.id]
	background(80)
	inp.show()
	playBtn.show()
	nextColourBtn.show()
	prevColourBtn.show()
	push()
	//draws sample colour square
	fill(player.currentColour)
	rectMode(CENTER)
	rect(WIDTH / 2, HEIGHT / 2, 100, 100)
	pop()
	push()
	textAlign(CENTER)
	stroke('black')
	textSize(30)
	text("Multiplayer Snake", WIDTH / 2, 60)
	pop()
}

function showDeathScreen() {
	inp.hide()
	playBtn.hide()
	nextColourBtn.hide()
	prevColourBtn.hide()
	push()
	background(80)
	textAlign(CENTER)
	stroke('black')
	textSize(48)
	text("GAME OVER", WIDTH / 2, HEIGHT / 2)
	drawLeaderboard()
	pop()
}

function keyPressed() {
	//if spacebar
	if (keyIsDown(32)) {
		socket.emit("backToStart", socket.id);
	}
	else {
		socket.emit("input", key, socket.id)
	}
}

function showSnakes() {
	//draws all snakes
	for (let snake of Object.values(game.snakes)) {
		if(!snake.dead){
			push()
			fill(snake.colour)
			square(snake.x + 1, snake.y + 1, snake.width)
			for (let i = 0; i < snake.tail.length; i++) {
				square(snake.tail[i][0] + 1, snake.tail[i][1] + 1, snake.width)
			}
			pop()
			
			push()
			textAlign(CENTER)
			stroke('white')
			fill('white')
			text(snake.name, snake.x + 10, snake.y + 35)
			pop()
			push()
			textSize(16)
			textAlign(LEFT)
			stroke('white')
			fill('white')
			let scoreText = "Score: " + snake.length
			text(scoreText, 10, 30)
			pop()
		}
	}
}

function showFoods() {
	//draws all foods
	for (let food of game.foods) {
		push()
		fill('red')
		square(food.x, food.y, food.width)
		pop()
	}
}

function nameInput() {
	//sets max name length
	let name = this.value()
	if (name.length > 12) {
		this.value(name.substring(0, name.length - 1))
	}
	return name
}

function playBtnPressed() {
	let player = game.players[socket.id]
	// if a name is chosen then spawn snake
	if (inp.value() != "") {
		socket.emit("spawn", player.currentColour, inp.value(), socket.id)
	}
}

function nextColour() {
	socket.emit("nextColour", socket.id)
}

function prevColour() {
	socket.emit("prevColour", socket.id)
}

function createButtons() {
	//create play button
	playBtn = createButton('Play!')
	playBtn.style('background-color', '#ff0000')
	playBtn.position(WIDTH / 4, HEIGHT - 80)
	playBtn.size(WIDTH / 2, WIDTH / 10)
	playBtn.mousePressed(playBtnPressed)
	playBtn.hide()

	// create colour cycle buttons
	nextColourBtn = createButton('>')
	prevColourBtn = createButton('<')
	nextColourBtn.style('background-color', 'white')
	prevColourBtn.style('background-color', 'white')
	nextColourBtn.style('font-size', '30px')
	prevColourBtn.style('font-size', '30px')
	nextColourBtn.position(WIDTH / 2 + 110, HEIGHT / 2 - 25)
	prevColourBtn.position(WIDTH / 2 - 150, HEIGHT / 2 - 25)
	nextColourBtn.size(50, 50)
	prevColourBtn.size(50, 50)
	nextColourBtn.mousePressed(nextColour)
	prevColourBtn.mousePressed(prevColour)
	nextColourBtn.hide()
	prevColourBtn.hide()
}

function createInputs() {
	//create name input field
	inp = createInput('hi')
	inp.id('nameInput')
	inp.placeholder = "hi"
	inp.position(WIDTH / 4, HEIGHT / 5)
	inp.size(WIDTH / 2, WIDTH / 10)
	inp.input(nameInput)
	inp.style('text-align', 'center')
	inp.style('font-size', '24px')
	inp.hide()
}