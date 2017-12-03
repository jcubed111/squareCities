class Renderable{
	render() {
		if(this.floats == undefined) {
			this.floats = new Float32Array(
				this.generateVerts().map(v => v.toArray()).reduce((a, b) => a.concat(b), [])
			);
		}

		if(this.floats.length == 0) return;

    	gl.bufferData(gl.ARRAY_BUFFER, this.floats, gl.DYNAMIC_DRAW);
    	gl.drawArrays(gl.TRIANGLES, 0, this.floats.length/8);
	}

	markDirty() {
		this.floats = null;
	}
}

class Intersection extends Renderable{
	constructor(xIndex, yIndex, nRoad, sRoad, eRoad, wRoad) {
		super();

		this.xIndex = xIndex;
		this.yIndex = yIndex;

		this.nRoad = nRoad;
		this.sRoad = sRoad;
		this.eRoad = eRoad;
		this.wRoad = wRoad;

		this.roads = [nRoad, eRoad, sRoad, wRoad];

		this.nRoad.intersection1 = this;
		this.eRoad.intersection1 = this;
		this.sRoad.intersection0 = this;
		this.wRoad.intersection0 = this;

		this.type = 0;
	}

	generateVerts() {
		const centerX = this.xIndex * 10 - 45;
		const centerY = this.yIndex * 10 - 45;

		var [rotation, config] = this.getConnectionConfig();

		switch(config) {
			case '0000':
			case '1010':
			case '2020':
			case '3030':
				return [];
			case '1111':
				return objectToVertArray("inter1111", 0, centerX, centerY);
			case '1110':
				return objectToVertArray("inter1110", rotation, centerX, centerY);
			case '1100':
				return objectToVertArray("inter1100", rotation-1, centerX, centerY);
			case '1000':
				return objectToVertArray("inter1000", rotation+1, centerX, centerY);
			case '2121':
				return objectToVertArray("inter2121", rotation, centerX, centerY);
			case '2222':
				return objectToVertArray("inter2222", 0, centerX, centerY);
			case '2221':
				return objectToVertArray("inter2221", rotation+1, centerX, centerY);
			case '2211':
				return objectToVertArray("inter2211", rotation+2, centerX, centerY);
			case '2111':
				return objectToVertArray("inter2111", rotation-1, centerX, centerY);
			case '2220':
				return objectToVertArray("inter2220", rotation-2, centerX, centerY);
			case '2200':
				return objectToVertArray("inter2200", rotation-2, centerX, centerY);
			case '2101':
				return objectToVertArray("inter2101", rotation, centerX, centerY);
			case '2120':
				return objectToVertArray("inter2120", rotation, centerX, centerY);

			default: return [];
		}
	}

	getConnectionConfig() {
		let typeList = this.roads.map(r => r.type).join(''); // nesw
		let rotation = 0;

		// take the version of typelist such that if it were a number it'd be the biggest
		function rot(type, n) {
			return type.slice(n) + type.slice(0, n);
		}
		const rotations = [
			[3, rot(typeList, 0)],
			[2, rot(typeList, 1)],
			[1, rot(typeList, 2)],
			[0, rot(typeList, 3)],
		];
		rotations.sort((a, b) => +b[1] - a[1]);
		return rotations[0];
	}

	getSize() {
		var [rotation, config] = this.getConnectionConfig();

		switch(config) {
			case '0000':
			case '1010':
			case '2020':
				return 0;
			case '1111':
			case '1110':
			case '1100':
				return 1;
			case '1000':
			case '2121':
			case '2222':
			case '2200':
			case '2221':
			case '2211':
			case '2111':
				return 2;

			default: return +config[0];
		}
	}

	regen() {
		this.markDirty();
		this.roads.forEach(r => r.markDirty());
	}

	setType(t) {
		this.type = t;
		this.regen();
	}
}

class Road extends Renderable{
	constructor(isNS, xIndex, yIndex) {
		super();

		this.isNS = isNS;
		this.xIndex = xIndex;
		this.yIndex = yIndex;

		this.type = 0; // 0 - no road, 1 - small, 2 - medium, 3 - highway
		this.intersection0 = null; // the intersection to the north or east
		this.intersection1 = null; // the intersection to the south or west
	}

	generateVerts() {
		if(this.type == 0) return [];
		const roadZ = 0.1;

		const size0 = this.intersection0.getSize();
		const size1 = this.intersection1.getSize();

		const texBySize = [
			null,
			new TexSpec(0, 1, 3, 2),
			new TexSpec(6, 2, 9, 4),
		];

		if(this.isNS) {
			const xMin = -55 +  this.xIndex*10 + 10 - this.type;
			const xMax = -55 +  this.xIndex*10 + 10 + this.type;
			const yMin = -55 +  this.yIndex*10 + 10 + size1;
			const yMax = -55 +  this.yIndex*10 + 20 - size0;
			return building(
				new Vert(xMin, yMin, 0),
				new Vert(xMax, yMax, roadZ),
				new TexSpec(0, 0, 0, 0, 149, 149, 149),
				texBySize[this.type],
				true
			);
		}else{
			const xMin = -55 +  this.xIndex*10 + 10 + size1;
			const xMax = -55 +  this.xIndex*10 + 20 - size0;
			const yMin = -55 +  this.yIndex*10 + 10 - this.type;
			const yMax = -55 +  this.yIndex*10 + 10 + this.type;
			return building(
				new Vert(xMin, yMin, 0),
				new Vert(xMax, yMax, roadZ),
				new TexSpec(0, 0, 0, 0, 149, 149, 149),
				texBySize[this.type],
				false
			);
		}
	}

	setType(t) {
		this.type = t;
		this.markDirty();
		this.intersection0.regen();
		this.intersection1.regen();
	}
}

class Building extends Renderable{
	constructor(x, y, dx, dy) {
		super();

		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
	}

	generateVerts() {
		return objectToVertArray("building");
		return building(
	        new Vert(this.x, this.y, 0),
	        new Vert(this.x+this.dx, this.y+this.dy, 10),
			new TexSpec(0, 2, 1, 6),
			new TexSpec(0, 0, 0, 0, 200, 190, 180),
	    );
	}
}

class Base extends Renderable{
	generateVerts() {
		const verts = [];
		for(let x=0; x < 11; x++) {
			for(let y=0; y < 11; y++) {
				verts.push.apply(verts, square(
					new Vert(x*10-55, y*10-55, 0, 13.25, 1.25),
					new Vert(x*10-45, y*10-55, 0, 15.75, 1.25),
					new Vert(x*10-45, y*10-45, 0, 15.75, 3.75),
					new Vert(x*10-55, y*10-45, 0, 13.25, 3.75)
				));
			}
		}
		return verts;

		return building(
	        new Vert(-55, -55, -5),
	        new Vert(55, 55, 0),
			new TexSpec(1, 0, 16, 1),
			new TexSpec(0, 0, 0, 0, 0, 216, 0),
	    );
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
		nullRoad.type = 0;

		this.nsRoads = makeArray(10, 9, (x, y) => new Road(true, x, y)); // [x - 10][y - 9]
		this.ewRoads = makeArray(9, 10, (x, y) => new Road(false, x, y)); // [x - 10][y - 9]
		this.intersections = makeArray(10, 10, (x, y) => {
			const nRoad = y == 9 ? nullRoad : this.nsRoads[x][y];
			const sRoad = y == 0 ? nullRoad : this.nsRoads[x][y-1];
			const eRoad = x == 9 ? nullRoad : this.ewRoads[x][y];
			const wRoad = x == 0 ? nullRoad : this.ewRoads[x-1][y];

			return new Intersection(x, y, nRoad, sRoad, eRoad, wRoad);
		});

		this.buildings = [new Building(0, 0, 2, 2)];
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
