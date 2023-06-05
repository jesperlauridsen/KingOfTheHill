import { SceneManager } from './scene.js';

export class Game {
	static SceneManager;
	static socket;
	constructor() {
		this.socket = io();
		this.initSocketEvents();
		this.SceneManager = new SceneManager();
		this.SceneManager.handleWindowResize();
		//console.log(this.scene);

		window.addEventListener('resize', this.SceneManager.handleWindowResize);
	}

	initSocketEvents() {
		this.socket.emit('ping');
		this.socket.on('pong', () => {
			console.log('Received pong from server');
		});

		this.socket.on('players', players => {
			console.log('Received players:', players);
			// Handle the list of players received from the server
			// Update your game state accordingly
		});

		this.socket.on('playerConnected', player => {
			console.log('Player connected:', player);
			// Handle a new player connected event
			// Update your game state accordingly
		});

		this.socket.on('playerDisconnected', player => {
			console.log('Player disconnected:', player);
			// Handle a player disconnected event
			// Update your game state accordingly
		});

		this.socket.on('gameState', game => {
			//console.log('gameState:', game);
			this.processGameData(game);
			// Handle the received player positions
			// Update your game state accordingly
		});
	}

	createMaterial = materialData => {
		let newMaterial = new THREE.Material();
		switch (materialData.type) {
			case 'MeshBasicMaterial':
				newMaterial = new THREE.MeshBasicMaterial();
				break;
			case 'MeshPhongMaterial':
				newMaterial = new THREE.MeshPhongMaterial();
				break;
			// Add more cases for other material types as needed

			default:
				// Handle unknown material types or fallback to a default material
				newMaterial = new THREE.MeshBasicMaterial();
				break;
		}

		// Set the material properties from the serialized data
		newMaterial.setValues(materialData);
		return newMaterial;
	};

	processGameData = game => {
		const { players, threeObjects, cannonObjects } = game;
		//console.log(this.SceneManager.scene, worldObjects, cannonObjects);
		// Process players
		/* players.forEach(player => {
			// Extract player data
			const { id, name, position, rotation, scale } = player;

			// Check if player object exists in the scene
			const existingPlayer = this.SceneManager.scene.getObjectById(id);
			if (existingPlayer) {
				// Update existing player properties
				existingPlayer.position.copy(position);
				existingPlayer.rotation.copy(rotation);
				existingPlayer.scale.copy(scale);
			} else {
				// Create a  new player object and add it to the scene
				const newPlayer = new THREE.Object3D();
				newPlayer.position.copy(position);
				newPlayer.rotation.copy(rotation);
				newPlayer.scale.copy(scale);
				newPlayer.userData.id = id;
				this.SceneManager.scene.add(newPlayer);
			}
		}); */

		// Process worldObjects for Three.js
		threeObjects.forEach(object => {
			//console.log(object);
			// Extract object data
			const { id, position, rotation, scale } = object;

			// Check if object exists in the scene
			const existingObject = this.SceneManager.findWorldObject(id);
			//console.log('OBJECT', object, existingObject);
			if (existingObject) {
				// Update existing object properties
				existingObject.position?.copy(new THREE.Vector3().fromArray(position));
				existingObject.rotation?.copy(new THREE.Euler().fromArray(rotation));
				existingObject.scale?.copy(new THREE.Vector3().fromArray(scale));
			} else {
				console.log(object);
				// Create a new object and add it to the scene
				const loader = new THREE.BufferGeometryLoader();

				const geometry = loader.parse(object.geometry);
				let material = this.createMaterial(object.material);
				const newObject = new THREE.Mesh(geometry, material);
				newObject.position.copy(new THREE.Vector3().fromArray(position));
				newObject.rotation.copy(new THREE.Euler().fromArray(rotation));
				newObject.scale.copy(new THREE.Vector3().fromArray(scale));
				newObject.userData.id = id;
				this.SceneManager.addWorldObject(newObject);
			}
		});

		// Process cannonObjects for CANNON
		cannonObjects.forEach(object => {
			// Extract object data
			const { id, mass, damping, shape, forces, constraints, velocity, angularVelocity, position, rotation } = object;
			// Check if object exists in the CANNON world
			//console.log(this.SceneManager.world.bodies, 'what we work with');
			const existingObject = this.SceneManager.world.bodies.find(body => body.userData.id === id);
			if (existingObject) {
				//console.log('EXISTING OBJECT', existingObject, object);
				// Update existing object properties
				existingObject.mass = 0.01;
				existingObject.damping = damping;
				existingObject.position.set(position[0], position[1], position[2]);
				existingObject.velocity.set(velocity[0], velocity[1], velocity[2]);
				existingObject.angularVelocity.set(angularVelocity[0], angularVelocity[1], angularVelocity[2]);
				const { x, y, z, w } = rotation;
				const quaternion = new CANNON.Quaternion(x, y, z, w);
				existingObject.quaternion.copy(quaternion);

				// Update other properties as needed
			} else {
				// Create a new CANNON object and add it to the world
				//console.log('NEW OBJECT', shape);
				const BoxShape = new CANNON.Box(
					new CANNON.Vec3(shape.halfExtents[0], shape.halfExtents[1], shape.halfExtents[2])
				);
				const newObject = new CANNON.Body({ mass: 0.01, damping: object.damping });
				newObject.userData = { id: id };
				newObject.addShape(BoxShape);
				newObject.position.set(position[0], position[1], position[2]);
				newObject.quaternion.set(rotation[0], rotation[1], rotation[2], rotation[3]);
				newObject.velocity.set(velocity[0], velocity[1], velocity[2]);
				newObject.angularVelocity.set(angularVelocity[0], angularVelocity[1], angularVelocity[2]);
				// Set up the new object's shape and other properties
				// ...
				this.SceneManager.world.addBody(newObject);
				//this.SceneManager.cannonObjects.push(newObject);
				//console.log(this.SceneManager.world);
			}
		});
	};

	sendInteraction(position) {
		const interactionData = {
			position: position,
		};
		this.socket.emit('interaction', interactionData);
	}
}
