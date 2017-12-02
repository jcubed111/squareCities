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

		const typeList = this.roads.map(r => r.type).join(''); // nesw
		switch(typeList) {
			case '0000':
			case '0101':
			case '1010':
				return [];
			case '1111':
				return this.type1_4WayStop();
			case '1100':
				return objectToVertArray("type1turn", 2, centerX, centerY);
			case '0110':
				return objectToVertArray("type1turn", 1, centerX, centerY);
			case '0011':
				return objectToVertArray("type1turn", 0, centerX, centerY);
			case '1001':
				return objectToVertArray("type1turn", 3, centerX, centerY);
			default: return [];
		}
	}

	type1_4WayStop() {
		const xmin = this.xIndex * 10 - 45 - 1;
		const xmax = this.xIndex * 10 - 45 + 1;
		const ymin = this.yIndex * 10 - 45 - 1;
		const ymax = this.yIndex * 10 - 45 + 1;

		const verts = building(
	        new Vert(xmin, ymin, 0),
	        new Vert(xmax, ymax, 0.1),
			new TexSpec(0, 0, 0, 0, 149, 149, 149),
			new TexSpec(3, 1, 4, 2),
	    );

	    // add stop signs
	    verts.push.apply(verts, this.stopSign(xmin, ymin, false));
	    verts.push.apply(verts, this.stopSign(xmin, ymax, true));
	    verts.push.apply(verts, this.stopSign(xmax, ymax, false));
	    verts.push.apply(verts, this.stopSign(xmax, ymin, true));

	    return verts;
	}

	stopSign(x, y, alongXAxis) {
		const height = 0.9;
		const radius = 0.25;
		const poleRadius = 0.02;
		// returns verts to make a stop sign
		const coords = [
			[0.3, 0],
			[0.7, 0],
			[1, 0.3],
			[1, 0.7],
			[0.7, 1],
			[0.3, 1],
			[0, 0.7],
			[0, 0.3],
		];

		const verts = coords.map(c => new Vert(
			x + (alongXAxis ? radius*2*(c[0] - 0.5) : 0),
			y + (!alongXAxis ? radius*2*(c[0] - 0.5) : 0),
			height + radius*2*(c[1] - 0.5),
			1+c[0],
			3-c[1]
		));

		return [
			verts[0], verts[1], verts[2],
			verts[0], verts[2], verts[3],
			verts[0], verts[3], verts[4],
			verts[0], verts[4], verts[5],
			verts[0], verts[5], verts[6],
			verts[0], verts[5], verts[7],

			verts[0], verts[7], verts[6],
			verts[0], verts[6], verts[5],
			verts[0], verts[5], verts[4],
			verts[0], verts[4], verts[3],
			verts[0], verts[3], verts[2],
			verts[0], verts[2], verts[1],
		].concat(building(
			new Vert(x-poleRadius, y-poleRadius, 0),
			new Vert(x+poleRadius, y+poleRadius, height-radius),
			new TexSpec(0, 0, 0, 0, 220, 220, 220),
			new TexSpec(0, 0, 0, 0, 220, 220, 220),
		));
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
