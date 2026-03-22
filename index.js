//imports libraries
const express = require('express');
const socket = require('socket.io');
const fs = require('fs');

//constants
const WIDTH = 500
const HEIGHT = 500
const COLOURS = ['orange', 'yellow', 'green', 'blue', 'indigo', 'violet']

//classes
class Snake {
	constructor(colour, name, id) {
		this.dead = false
		this.id = id
		this.colour = colour
		this.name = name
		this.unitWidth = 20
		this.x = Math.floor(Math.random() * (WIDTH-this.unitWidth)/this.unitWidth) * this.unitWidth
		this.y = Math.floor(Math.random() * (HEIGHT-this.unitWidth)/this.unitWidth) * this.unitWidth
		this.xDir = 0
		this.yDir = 0
		this.changedDir = false
		this.width = 18
		this.tail = []
		this.length = 3
	}

	snakeCollisionCheck() {
		for(let i = 0; i<Object.values(game.snakes).length; i++){
			let snake = Object.values(game.snakes)[i]
			if(snake != this){
				//head collision
				let headCheck = this.collideRect(
					this.x + 1, this.y + 1, this.width, this.width, snake.x + 1, snake.y + 1, snake.width, snake.width)
				if(headCheck) {
					game.collisions.push(new SnakeCollision(this, snake, true))
					return;
				}
			//tail collision
			}
			for (let tail of snake.tail) {
				this.check = this.collideRect(
					this.x + 1, this.y + 1, this.width, this.width,
					tail[0] + 1, tail[1] + 1,
					snake.width, snake.width)
				if (this.check) {
					//creates collision if the snake head collides with any tail 
					game.collisions.push(new SnakeCollision(this, snake, false))
		
					return;
				}
			}
		}
	}
	moveSnake() {

		//allows a new change of direction
		this.changedDir = false
		
		if(this.xDir != 0 || this.yDir != 0){
			if(!(this.tail.length < this.length-1)){
				//if tail length is not the actual length it doesnt remove a square
				this.tail.shift()
			}
			//tail follows head based on head previous position
			this.tail.push([this.x, this.y])	
		}

		//moves head based on direction of snake
		this.x += (this.unitWidth * this.xDir)
		this.y += (this.unitWidth * this.yDir)

		//check for snakes colliding
		this.snakeCollisionCheck()

		this.updateSnake()
	}

	changeDir(direction, key) {
		if (!this.changedDir) {
			//set new direction
			this.xDir = direction[0]
			this.yDir = direction[1]
			//shows a change of direction has already happened this movement cycle
			this.changedDir = true
		}
	}

	updateSnake() {
		// checks for snake going off the screen
		if(!this.changedDir){
			if (this.x > WIDTH-20) {
				this.x=0
				this.xDir = 1
				this.yDir = 0
			}
			else if (this.x < 0){
				this.x = WIDTH-20
				this.xDir = -1
				this.yDir = 0
			}
			else if(this.y < 0) {
				this.y = HEIGHT
				this.yDir = -1
				this.xDir = 0
			}
			else if (this.y > HEIGHT-20){
				this.y = 0
				this.yDir = 1
				this.xDir = 0
			}
		}
	}

	addLength() {
		//respawn the food
		game.foods.push(new Food())

		//increase length of tail on eating
		this.length+=1
		
		//removes collision which has been dealt with
		game.collisions.pop()
	}

	death() {
		//set player state to dead
		game.players[this.id].alive = false

		if(this.length>game.players[this.id].highscore){
			game.players[this.id].highscore = this.length
			console.log(this.length)
			game.leaderboard[this.id] = {name: this.name, score:this.length}

			let data = JSON.stringify(game.leaderboard)
			fs.writeFile('highscore.json', data, (err) => {
			  if (err) {
			  	console.log('Saved!')
					throw err;
				}
			});
		}
		//remove snake from object
		delete game.snakes[this.id]

		//remove collsion from array now it has been handled
		game.collisions.pop()
	}

	//code for collision detection taken from collide2d
	collideRect(x, y, w, h, x2, y2, w2, h2) {
		if (x + w >= x2 &&
			x <= x2 + w2 &&
			y + h >= y2 &&
			y <= y2 + h2) {
			return true;
		}
		return false;
	}
}
class Player {
	constructor() {
		this.alive = null
		this.highscore = 0
		this.colourIndex = 0
		this.currentColour = COLOURS[this.colourIndex]
	}
}
class Game {
	constructor() {
		this.players = {}
		this.foods = []
		this.collisions = []
		this.snakes = {}
		this.leaderboard={}
		//loads leaderboard from previous game sessions
		fs.readFile("highscore.json", (error, data) => {
			if (error) {
    		console.error(error)
    		throw err;
  		}
			this.leaderboard = JSON.parse(data)
		})
		
		//create foods
		this.foods.push(new Food())
	}

	moveSnakes() {
		for (let snake of Object.values(this.snakes)) {
			snake.moveSnake()
		}
	}

	updateGame() {
		//update objects
		for (let snake of Object.values(this.snakes)) {
			snake.moveSnake()
		}
		for (let food of this.foods) {
			food.updateFood()
		}
	}
}
class Food {
	constructor() {
		this.gridWidth = 20
		this.xChoices = []
		//creates array of possible x locations
		for (let i = 0; i <= WIDTH-this.gridWidth; i += 20) {
			this.xChoices.push(i)
		}
		//creates array of possible y locations
		this.yChoices = []
		for (let i = 0; i <= HEIGHT-this.gridWidth; i += 20) {
			this.yChoices.push(i)
			
		}

		//picks spawn location
		this.xIndex = Math.floor(Math.random() * (this.xChoices.length - 1))

		this.yIndex = Math.floor(Math.random() * (this.yChoices.length - 1))									 
		this.x = this.xChoices[this.xIndex]
		this.y = this.yChoices[this.yIndex]

		//width of 18 for collision purposes
		this.width = 18
		this.x += 1
		this.y += 1
	}

	updateFood() {
		if (game.snakes != []) {
			for (let snake of Object.values(game.snakes)) {
				//checks if food has been eaten
				this.eat = this.collideRect(
					this.x, this.y, this.width, this.width,
					snake.x, snake.y,
					snake.unitWidth, snake.unitWidth)
				if (this.eat) {
					game.collisions.push(new FoodCollision(snake, this))
				}
			}
		}
	}

	//collision detection taken form collide2d
	collideRect(x, y, w, h, x2, y2, w2, h2) {
		if (x + w >= x2 &&
			x <= x2 + w2 &&
			y + h >= y2 &&
			y <= y2 + h2) {
			return true;
		}
		return false;
	}
}
class Collision {
	constructor(crashedObject, collidedWith) {
		//object which crashed into something
		this.crashedObject = crashedObject
		//object which got crashed into
		this.collidedWith = collidedWith
	}
}
class WallCollision extends Collision {
	constructor(crashedObject, collidedWith) {
		super(crashedObject, collidedWith)
		//kills snake 
		this.crashedObject.death()
	}
}
class SnakeCollision extends Collision {
	constructor(crashedObject, collidedWith, head) {
		super(crashedObject, collidedWith)
		//kills the snake whose head hit the other snake
		this.head = head
		this.crashedObject.death()
		if(this.head){
			this.collidedWith.death()
		}
	}
}
class FoodCollision extends Collision {
	constructor(crashedObject, collidedWith) {
		super(crashedObject, collidedWith)
		//removes food from foods array
		game.foods.splice(game.foods.indexOf(this.collidedWith), 1)
		//snake eats the food
		this.crashedObject.addLength()
	}
}

//create game instance
let game = new Game(500, 500)


//create express app and tells it what folder to serve
let app = express();
app.use(express.static('public'))

//listening for client emits
let server = app.listen(process.env.PORT || 3000, function() {
	console.log("server running")
})

//setup socket connection
let io = socket(server);

//sends client gamestate x times a second
// setInterval(function() {
// 	game.updateGame()
// 	io.emit("gamestate", game);
// 	module.exports = game;
// }, 1000 / 60)

setInterval(function() {
	//game.moveSnakes()
	game.updateGame()
	io.emit("gamestate", game);
	//io.emit("moveSnakes", game);
}, 1000 / 6)

io.on('connection', function(socket) {
	console.log('made socket connection to ', socket.id)
	//when a new player joins
	game.players[socket.id] = new Player()	

	socket.on('disconnect', function () {
		delete game.players[socket.id]
		delete game.snakes[socket.id]
  });

	socket.on('input', function(key, socketID) {
		let player = game.players[socketID]
		let snake = game.snakes[socketID]

		if (player.alive && snake != null) {
			if (key == "d" && snake.xDir != -1) {
				game.snakes[socketID].changeDir([1, 0])
			}
			else if (key == "a" && snake.xDir != 1) {
				game.snakes[socketID].changeDir([-1, 0])
			}
			else if (key == "w" && snake.yDir != 1) {
				game.snakes[socketID].changeDir([0, -1])
			}
			else if (key == "s" && snake.yDir != -1) {
				game.snakes[socketID].changeDir([0, 1])
			}
		}
	})
	socket.on('spawn', function(colour, name, socketID) {
		//new snake
		game.snakes[socketID] = new Snake(colour, name, socketID)
		game.players[socketID].alive = true
	})

	socket.on('backToStart', function(socketID) {
		if (game.players[socketID].alive == false) {
			game.players[socketID].alive = null
		}
	})

	socket.on('nextColour', function(socketID) {
		if (game.players[socketID].colourIndex == COLOURS.length - 1) {
			game.players[socketID].colourIndex = 0
		} else {
			game.players[socketID].colourIndex += 1
		}
		game.players[socketID].currentColour = COLOURS[game.players[socketID].colourIndex]
	})

	socket.on('prevColour', function(socketID) {
		if (game.players[socketID].colourIndex == 0) {
			game.players[socketID].colourIndex = COLOURS.length - 1
		} else {
			game.players[socketID].colourIndex -= 1
		}
		game.players[socketID].currentColour = COLOURS[game.players[socketID].colourIndex]
	})
});