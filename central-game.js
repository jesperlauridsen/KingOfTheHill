const Cannon = require('cannon');
const THREE = require('three');
class Game {
	constructor() {
		this.scene = new THREE.Scene();
		this.world = new Cannon.World();
		this.world.gravity.set(0, -9.81, 0);
		this.threeObjects = [];
		this.cannonObjects = [];
		this.players = [];
		this.createWorld();
		this.fixedTimeStep = 1 / 60; // Desired fixed time step (e.g., 60 FPS)
		this.maxSubSteps = 3; // Maximum number of substeps to allow per frame
	}

	createWorld() {
		console.log('Building world');
		// Create the island

		this.addIsland();
		this.generateCubes(50);
	}

	addIsland() {
		const islandShape = new THREE.BoxGeometry(10, 0.2, 10);
		const islandMaterial = new THREE.MeshPhongMaterial({ color: Math.random() * 0xffffff, depthTest: true });
		const island = new THREE.Mesh(islandShape, islandMaterial);
		//island.rotation.x = -Math.PI / 2; // Rotate the ground to be horizontal
		island.position.y = 0; // Move the ground down by 1 unit
		this.scene.add(island);
		// Create a Cannon.js body for the ground
		const CannonIslandShape = new Cannon.Box(new Cannon.Vec3(5, 0.1, 5));
		const islandBody = new Cannon.Body({ mass: 0 });
		islandBody.addShape(CannonIslandShape);
		islandBody.userData = { name: 'island' };
		islandBody.position.set(0, -2, 0);
		this.world.addBody(islandBody);
		this.threeObjects.push(island);
		this.cannonObjects.push(islandBody);
	}
	updateWorld(delta) {
		this.world.step(this.fixedTimeStep, delta, this.maxSubSteps);
		//this.world.step(1 / 60, 1, 1 / 60);
	}
	getWorld() {
		return this.world;
	}
	addCube(position) {
		console.log('adding cube');
		const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

		const cubeMaterial = new THREE.MeshPhongMaterial({ color: this.getRandomColor() });
		const cubeMesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
		cubeMesh.position.x = position.x;
		cubeMesh.position.y = position.y;
		cubeMesh.position.z = position.z;
		cubeMesh.rotation.x = Math.random() * Math.PI * 2; // Random rotation around the x-axis
		cubeMesh.rotation.y = Math.random() * Math.PI * 2; // Random rotation around the y-axis
		cubeMesh.rotation.z = Math.random() * Math.PI * 2; // Random rotation around the z-axis

		this.threeObjects.push(cubeMesh);
		this.scene.add(cubeMesh);
		// Create a Cannon.js body for the cube
		const cubeShape = new Cannon.Box(new Cannon.Vec3(0.5, 0.5, 0.5));
		const cubeBody = new Cannon.Body({ mass: 0.01 });
		// Apply a random rotation to the cube's physics body
		const randomQuat = new Cannon.Quaternion();
		randomQuat.setFromEuler(
			Math.random() * Math.PI * 2,
			Math.random() * Math.PI * 2,
			Math.random() * Math.PI * 2,
			'XYZ'
		);
		cubeBody.quaternion.copy(randomQuat);

		cubeBody.addShape(cubeShape);
		cubeBody.userData = {
			name: 'cube',
		};
		cubeBody.position.copy(cubeMesh.position);
		this.world.addBody(cubeBody);
		this.cannonObjects.push(cubeBody);
	}

	generateCubes(number) {
		const numCubes = number;
		const minHeight = 5;
		const maxHeight = 100;
		const minX = -4;
		const maxX = 4;

		for (let i = 0; i < numCubes; i++) {
			const x = getRandomNumber(minX, maxX);
			const y = getRandomNumber(minHeight, maxHeight);
			const z = getRandomNumber(minX, maxX);
			this.addCube({ x: x, y: y, z: z });
		}

		function getRandomNumber(min, max) {
			return Math.random() * (max - min) + min;
		}
	}

	getRandomColor() {
		const letters = '0123456789ABCDEF';
		let color = '#';
		for (let i = 0; i < 6; i++) {
			color += letters[Math.floor(Math.random() * 16)];
		}
		return color;
	}
}

module.exports = Game;
