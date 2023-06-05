export class SceneManager {
	static camera;
	static scene;
	static renderer;
	static threeObjects;
	static cannonObjects;
	static players;
	static world;
	static solver;
	static fixedTimeStep;
	static maxSubSteps;
	static stats;

	constructor() {
		// Create a scene
		this.scene = new THREE.Scene();

		// Create a camera
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
		this.camera.position.z = -12;
		this.camera.position.y = 4;

		// Create an array for world objects
		this.threeObjects = [];
		this.cannonObjects = [];

		// Create an array for players
		this.players = [];

		// Create a renderer
		this.renderer = new THREE.WebGLRenderer();
		this.renderer.setSize(window.innerWidth, window.innerHeight);

		// Create OrbitControls
		const controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
		controls.update();

		// Append the renderer to the document body
		document.body.appendChild(this.renderer.domElement);

		// Create a Cannon.js world
		this.world = new CANNON.World();
		this.world.gravity.set(0, -0.002, 0); // Set the gravity

		// Configure the physics solver and collision detection
		this.solver = new CANNON.GSSolver();
		this.world.solver = new CANNON.SplitSolver(this.solver);
		this.world.broadphase = new CANNON.NaiveBroadphase();
		this.world.broadphase.useBoundingBoxes = true;

		// Set the time step for physics calculations
		this.fixedTimeStep = 1 / 60; // 60 FPS
		this.maxSubSteps = 3; // Maximum number of substeps per frame

		//for testing:
		//this.addGround();
		//this.addFloatingIsland();
		//this.generateCubes();
		this.addAmbientLight();
		this.addSpotlight();
		this.start();
	}

	addWorldObject(object) {
		this.scene.add(object);
		this.threeObjects.push(object);
	}

	findWorldObject(id) {
		return this.threeObjects.find(object => object.userData.id === id) || null;
	}

	removeWorldObject(object) {
		this.scene.remove(object);
		const index = this.threeObjects.indexOf(object);
		if (index !== -1) {
			this.threeObjects.splice(index, 1);
		}
	}

	addPlayer(player) {
		this.scene.add(player.mesh);
		this.players.push(player);
	}

	removePlayer(player) {
		this.scene.remove(player.mesh);
		const index = this.players.indexOf(player);
		if (index !== -1) {
			this.players.splice(index, 1);
		}
	}

	// testing functions:

	addFloatingIsland() {
		// Create the geometry for the island (box shape)
		const islandGeometry = new THREE.BoxGeometry(6, 0.5, 6); // Customize the size as needed

		// Create a material for the island
		const islandMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, side: THREE.DoubleSide });

		// Create the mesh using the geometry and material
		const islandMesh = new THREE.Mesh(islandGeometry, islandMaterial);

		// Set the position of the island
		islandMesh.position.set(0, 0, 0); // Modify the position as per your requirements

		// Add the island mesh to the scene and the worldObjects array
		this.addWorldObject(islandMesh);

		// Create a Cannon.js body for the island
		const islandShape = new CANNON.Box(new CANNON.Vec3(3, 0.25, 3)); // Use half extents for box shape
		const islandBody = new CANNON.Body({ mass: 0 });
		islandBody.addShape(islandShape);
		islandBody.position.copy(islandMesh.position);
		this.world.addBody(islandBody);
	}

	addGround() {
		const groundGeometry = new THREE.PlaneGeometry(10, 10);
		const groundMaterial = new THREE.MeshPhongMaterial({ color: 0x808080, side: THREE.DoubleSide });
		const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
		groundMesh.rotation.x = -Math.PI / 2; // Rotate the ground to be horizontal
		groundMesh.position.y = -20; // Move the ground down by 1 unit
		this.addWorldObject(groundMesh);

		// Create a Cannon.js body for the ground
		const groundShape = new CANNON.Plane();
		const groundBody = new CANNON.Body({ mass: 0 });
		groundBody.addShape(groundShape);
		groundBody.position.copy(groundMesh.position);
		groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate the ground to be horizontal
		this.world.addBody(groundBody);
	}

	addAmbientLight() {
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Color: white, Intensity: 0.5
		this.scene.add(ambientLight);
	}

	addSpotlight() {
		const spotlight = new THREE.SpotLight(0xffffff, 1); // Color: white, Intensity: 1
		spotlight.position.set(0, 10, 0); // Set the position of the spotlight
		spotlight.target.position.set(0, 0, 0); // Set the target position of the spotlight
		this.scene.add(spotlight);
		this.scene.add(spotlight.target);
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

		this.addWorldObject(cubeMesh);

		// Create a Cannon.js body for the cube
		const cubeShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
		const cubeBody = new CANNON.Body({ mass: 0.3 });
		// Apply a random rotation to the cube's physics body
		const randomQuat = new CANNON.Quaternion();
		randomQuat.setFromEuler(
			Math.random() * Math.PI * 2,
			Math.random() * Math.PI * 2,
			Math.random() * Math.PI * 2,
			'XYZ'
		);
		cubeBody.quaternion.copy(randomQuat);

		cubeBody.addShape(cubeShape);
		cubeBody.userData = {
			id: 'cube',
		};
		cubeBody.position.copy(cubeMesh.position);
		this.world.addBody(cubeBody);
	}

	generateCubes() {
		const numCubes = 40;
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

	updatePhysics = () => {
		this.world.step(this.fixedTimeStep, 1, this.fixedTimeStep);
	};

	toCannonVector = vector => {
		return new CANNON.Vec3(vector.x, vector.y, vector.z);
	};

	update() {
		this.stats.update();
		//console.log(this.scene);
		//this.updatePhysics();

		const groundThreshold = -1; // Threshold below which cubes will fall further down
		const additionalForce = new CANNON.Vec3(0, -0.1, 0); // Additional downward force

		for (let i = 0; i < this.threeObjects.length; i++) {
			const object = this.threeObjects[i];
			const body = this.world.bodies[i];

			if (object && body) {
				object.position.copy(body.position);
				object.quaternion.copy(body.quaternion);

				// Check if cube is below the ground threshold
				if (body.position.y < groundThreshold) {
					// Apply additional downward force to the cube
					body.applyForce(additionalForce, body.position);
				}
			}
		}
		// Render the scene with the camera
		this.renderer.render(this.scene, this.camera);

		// Call the update method recursively for the next frame
		requestAnimationFrame(() => this.update());
	}

	// Function to handle window resizing
	handleWindowResize = () => {
		console.log('handling resize!');
		const width = window.innerWidth;
		const height = window.innerHeight;

		this.renderer.setSize(width, height);
		this.camera.aspect = width / height;
		this.camera.updateProjectionMatrix();
	};

	start() {
		this.stats = new Stats();
		this.stats.showPanel(0); // 0: FPS
		document.body.appendChild(this.stats.dom);
		// Start the game loop
		this.update();
	}
}
