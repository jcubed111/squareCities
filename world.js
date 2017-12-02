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

		this.roads = [nRoad, sRoad, eRoad, wRoad];

		this.nRoad.intersection1 = this;
		this.eRoad.intersection1 = this;
		this.sRoad.intersection0 = this;
		this.wRoad.intersection0 = this;

		this.type = 0;
	}

	generateVerts() {
		if(this.roads.some(r => r.type != 1)) return [];

		const xmin = this.xIndex * 10 - 45 - 1;
		const xmax = this.xIndex * 10 - 45 + 1;
		const ymin = this.yIndex * 10 - 45 - 1;
		const ymax = this.yIndex * 10 - 45 + 1;

		return building(
	        new Vert(xmin, ymin, 0),
	        new Vert(xmax, ymax, 0.1),
			new TexSpec(0, 0, 0, 0, 149, 149, 149),
			new TexSpec(3, 1, 4, 2),
	    );
	}
}

class Road extends Renderable{
	constructor(isNS, xIndex, yIndex) {
		super();

		this.isNS = isNS;
		this.xIndex = xIndex;
		this.yIndex = yIndex;

		this.type = 1; // 0 - no road, 1 - small, 2 - medium, 3 - highway
		this.intersection0 = null; // the intersection to the north or east
		this.intersection1 = null; // the intersection to the south or west
	}

	generateVerts() {
		if(this.type == 0) return;
		const roadZ = 0.1;

		if(this.isNS) {
			const xMin = -55 +  this.xIndex*10 + 10 - this.type;
			const xMax = -55 +  this.xIndex*10 + 10 + this.type;
			const yMin = -55 +  this.yIndex*10 + 10 + this.type;
			const yMax = -55 +  this.yIndex*10 + 20 - this.type;
			return building(
				new Vert(xMin, yMin, 0),
				new Vert(xMax, yMax, roadZ),
				new TexSpec(0, 0, 0, 0, 149, 149, 149),
				new TexSpec(0, 1, 3, 2),
				true
			);
		}else{
			const xMin = -55 +  this.xIndex*10 + 10 + this.type;
			const xMax = -55 +  this.xIndex*10 + 20 - this.type;
			const yMin = -55 +  this.yIndex*10 + 10 - this.type;
			const yMax = -55 +  this.yIndex*10 + 10 + this.type;
			return building(
				new Vert(xMin, yMin, 0),
				new Vert(xMax, yMax, roadZ),
				new TexSpec(0, 0, 0, 0, 149, 149, 149),
				new TexSpec(0, 1, 3, 2),
				false
			);
		}
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
