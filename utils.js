const Cannon = require('cannon');

function createWorld(world, worldObjects) {
	console.log('building world');
	// Create the island

	const islandGeometry = new THREE.BoxGeometry(6, 0.5, 6); // Customize the size as needed
	// Create a material for the island
	const islandMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });

	// Create the mesh using the geometry and material
	const islandMesh = new THREE.Mesh(islandGeometry, islandMaterial);

	// Set the position of the island
	islandMesh.position.set(0, -2, 0); // Modify the position as per your requirements

	// Add the island mesh to the scene and the worldObjects array
	this.addWorldObject(islandMesh);

	const islandShape = new Cannon.Box(new Cannon.Vec3(3, 0.25, 3));
	const islandBody = new Cannon.Body({ mass: 0 });
	islandBody.addShape(islandShape);
	islandBody.position.set(0, -2, 0);
	world.addBody(islandBody);
	worldObjects.push(islandBody);

	// Add cubes to the world objects array
	/* 	for (let i = 0; i < 10; i++) {
		const cubeShape = new Cannon.Box(new Cannon.Vec3(0.2, Math.random() * 2 + 1, 0.2));
		const cubeBody = new Cannon.Body({ mass: 1 });
		cubeBody.addShape(cubeShape);
		cubeBody.position.set(Math.random() * 8 - 4, Math.random() * 10, Math.random() * 8 - 4);
		worldObjects.push(cubeBody);
		world.addBody(cubeBody);
	} */
}

module.exports = {
	createWorld,
};
