function drawBase() {
	drawVerts(cube(
        new Vert(-55, -55, 0, 1, 0),
        new Vert(55, -55, 0, 16, 0),
        new Vert(55, 55, 0, 1, 0),
        new Vert(-55, 55, 0, 16, 0),

        new Vert(-55, -55, -6, 1, 1),
        new Vert(55, -55, -6, 16, 1),
        new Vert(55, 55, -6, 1, 1),
        new Vert(-55, 55, -6, 16, 1),
    ));
}
