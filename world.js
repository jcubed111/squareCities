class Intersection{
	constructor(xIndex, yIndex, nRoad, sRoad, eRoad, wRoad) {
		this.xIndex = xIndex;
		this.yIndex = yIndex;

		this.nRoad = nRoad;
		this.sRoad = sRoad;
		this.eRoad = eRoad;
		this.wRoad = wRoad;

		this.roads = [nRoad, sRoad, eRoad, wRoad];

		this.nRoad.intersection1 = this;
		this.eRoad.intersection1 = this;
		this.sRoad.intersection0 = this;
		this.wRoad.intersection0 = this;

		this.type = 0;
	}

	render() {

	}
}

class Road{
	constructor(isNS, xIndex, yIndex) {
		this.isNS = isNS;
		this.xIndex = xIndex;
		this.yIndex = yIndex;

		this.type = 0; // 0 - no road, 1 - small, 2 - medium, 3 - highway
		this.intersection0 = null; // the intersection to the north or east
		this.intersection1 = null; // the intersection to the south or west
	}

	render() {
		if(this.isNS) {

		}
	}
}

class Building{
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	render() {

	}
}

class Base{
	render() {
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
}

function makeArray(w, h, valFunction) {
	const ret = [];
	for(let i=0; i<w; i++) {
		ret[i] = [];
		for(let j=0; j<h; j++) {
			ret[i][j] = valFunction(i, j);
		}
	}
	return ret;
}

class World{
	constructor() {
		const minorWidth = 110;
		const minorHeight = 110;

		// grid used when generating buildings
		this.gridFilled = makeArray(minorWidth, minorHeight, () => false);

		const nullRoad = new Road();

		this.nsRoads = makeArray(10, 9, (x, y) => new Road(true, x, y)); // [x - 10][y - 9]
		this.ewRoads = makeArray(9, 10, (x, y) => new Road(false, x, y)); // [x - 10][y - 9]
		this.intersections = makeArray(10, 10, (x, y) => {
			const nRoad = y == 9 ? nullRoad : this.nsRoads[x][y];
			const sRoad = y == 0 ? nullRoad : this.nsRoads[x][y-1];
			const eRoad = x == 9 ? nullRoad : this.ewRoads[x][y];
			const wRoad = x == 0 ? nullRoad : this.ewRoads[x-1][y];

			return new Intersection(x, y, nRoad, sRoad, eRoad, wRoad);
		});

		this.buildings = [];
		this.base = new Base();
	}

	render() {
		this.base.render();
		this.nsRoads.forEach(a => a.forEach(r => r.render()));
		this.ewRoads.forEach(a => a.forEach(r => r.render()));
		this.intersections.forEach(a => a.forEach(i => i.render()));
		this.buildings.forEach(b => b.render());
	}

	async generate() {

	}
}
