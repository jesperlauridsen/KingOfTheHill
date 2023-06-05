// Import required modules
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const Cannon = require('cannon');
const Game = require('./central-game');
let previousTime = new Date().getTime() / 1000;
// Create Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Array to store players
const game = new Game();

console.log(game);

// Serve the static files from the "public" directory
app.use(express.static(__dirname + '/public'));

// Socket.io connection logic
io.on('connection', socket => {
	console.log('A user connected');

	// Create a player object for the connected player
	const player = {
		id: socket.id,
		name: 'Player',
		position: { x: 0, y: 0, z: 0 },
	};

	// Add the player to the players array
	//game.players.push(player);

	// Send the current player list to the connected player
	//socket.emit('game', game);

	// Broadcast the new player to other connected players
	//socket.broadcast.emit('playerConnected', player);

	// Handle interaction event
	socket.on('interaction', interactionData => {
		// Find the player in the array by ID
		const index = game.players.findIndex(p => p.id === socket.id);
		if (index !== -1) {
			// Update the specific player in the players array based on the interaction data received
			// For example, you can update the player's position or any other properties
			game.players[index].position = interactionData.position;
		}
	});

	// Handle disconnect event
	socket.on('disconnect', () => {
		console.log('A user disconnected');

		// Find the player in the array by ID
		const index = game.players.findIndex(p => p.id === socket.id);
		if (index !== -1) {
			// Remove the player from the array
			const disconnectedPlayer = game.players.splice(index, 1)[0];

			// Broadcast the disconnected player to other connected players
			socket.broadcast.emit('playerDisconnected', disconnectedPlayer);
		}
	});
});

// Update the game state
const updateMechanics = () => {
	const currentTime = Date.now();
	const delta = (currentTime - previousTime) / 1000; // Convert to seconds
	previousTime = currentTime;
	// Step the physics world
	const islandBody = game.cannonObjects.find(body => {
		const userData = body.userData;
		return userData && userData.name === 'island';
	});
	islandBody ? titlIsland(islandBody) : null;

	game.cannonObjects.forEach(cannonObj => {
		if (cannonObj.userData.name === 'cube') {
			// Check if the cube's position falls below -20
			if (cannonObj.position.y < -40) {
				console.log('someone fell below!');
				// Set the cube's position randomly between +50 and +100
				const minHeight = 50;
				const maxHeight = 100;
				const minX = -4;
				const maxX = 4;

				const x = getRandomNumber(minX, maxX);
				const y = getRandomNumber(minHeight, maxHeight);
				const z = getRandomNumber(minX, maxX);
				cannonObj.position.set(x, y, z);
				// Reset the cube's velocity and angular velocity to zero
				cannonObj.velocity.set(0, 0, 0);
				cannonObj.angularVelocity.set(0, 0, 0);
				// Reset any other cube-specific properties as needed
			}
		}
	});
	//console.log('updating!');
	game.updateWorld(delta);
};

function getRandomNumber(min, max) {
	return Math.random() * (max - min) + min;
}

const titlIsland = islandBody => {
	const time = new Date().getTime() / 1000;
	const rotationX = Math.cos(time);
	const rotationZ = Math.sin(time);

	const quaternionX = new Cannon.Quaternion();
	const quaternionY = new Cannon.Quaternion();
	quaternionX.setFromAxisAngle(new Cannon.Vec3(1, 0, 0), rotationX / 2);
	quaternionY.setFromAxisAngle(new Cannon.Vec3(0, 0, 1), rotationZ / 2);

	const quaternion = quaternionX.mult(quaternionY);
	quaternion.normalize();

	islandBody.quaternion.copy(quaternion);
};

// Broadcast player positions at a specified interval
setInterval(() => {
	updateMechanics();

	const threeObjects = [];
	const cannonObjects = [];

	game.cannonObjects.forEach(cannonObj => {
		const cannonBoxShape = cannonObj.shapes[0]; // Assuming only one shape is attached

		const cannonObjectData = {
			id: cannonObj.id,
			type: 'cannon',
			mass: cannonObj.mass,
			damping: {
				linear: cannonObj.linearDamping,
				angular: cannonObj.angularDamping,
			},
			shape: {
				type: cannonBoxShape.type,
				halfExtents: cannonBoxShape.halfExtents.toArray(),
			},
			forces: [], // Store applied forces here if needed
			constraints: [], // Store connected constraints here if needed
			velocity: cannonObj.velocity.toArray(),
			angularVelocity: cannonObj.angularVelocity.toArray(),
			position: cannonObj.position.toArray(), // Add position data
			rotation: {
				x: cannonObj.quaternion.x,
				y: cannonObj.quaternion.y,
				z: cannonObj.quaternion.z,
				w: cannonObj.quaternion.w,
			},
		};
		cannonObjects.push(cannonObjectData);
	});
	game.threeObjects.forEach(threeObj => {
		const threeObjectData = {
			id: threeObj.id,
			type: 'three',
			position: threeObj.position?.toArray(),
			rotation: threeObj.rotation?.toArray(),
			scale: threeObj.scale?.toArray() || [1, 1, 1],
			geometry: threeObj.geometry.toNonIndexed().toJSON(),
			material: threeObj.material.toJSON(),
		};
		threeObjects.push(threeObjectData);
	});
	io.emit('gameState', { players: game.players, threeObjects: threeObjects, cannonObjects: cannonObjects });
}, 1000 / 60); // 60 times per second

// Start the server
server.listen(3500, () => {
	console.log('Server is running on http://localhost:3500');
});
