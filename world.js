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
		const centerX = this.xIndex * 10 - 55;
		const centerY = this.yIndex * 10 - 55;

		var [rotation, config] = this.getConnectionConfig();

		switch(config) {
			case '0000':
			case '1010':
			case '2020':
			case '3030':
				return [];
			case '1111':
				if(this.type == 0) {
					return objectToVertArray("inter1111", 0, centerX, centerY);
				}else{
					return objectToVertArray("roundabout", 0, centerX, centerY);
				}
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
			case '3300':
				return objectToVertArray("inter3300", rotation, centerX, centerY);
			case '3131':
				return objectToVertArray("inter3131", rotation, centerX, centerY);
			case '3232':
			case '3230':
				return objectToVertArray("inter3232", rotation, centerX, centerY);

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
			case '3030':
			case '3000':
				return 0;
			case '1111':
				return this.type == 0 ? 1 : 3; // roundabouts
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
			case '3300':
			case '3131':
				return 3;
			case '3232':
			case '3230':
				return 7;

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

	convertTo3131() {
		// convert form 3130 to 3131
		this.roads.forEach(r => {
			if(r.type == 0) {
				r.setType(1);
			}
		})
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

	bounds() {
		const size0 = this.intersection0.getSize();
		const size1 = this.intersection1.getSize();

		if(this.isNS) {
			return [
				-65 +  this.xIndex*10 + 10 - this.type, // xmin
				-65 +  this.xIndex*10 + 10 + this.type, // xmax
				-65 +  this.yIndex*10 + 10 + size1, // ymin
				-65 +  this.yIndex*10 + 20 - size0 // ymax
			];
		}else{
			return [
				-65 +  this.xIndex*10 + 10 + size1, // xmin
				-65 +  this.xIndex*10 + 20 - size0, // xmax
				-65 +  this.yIndex*10 + 10 - this.type, // ymin
				-65 +  this.yIndex*10 + 10 + this.type // ymax
			];
		}
	}

	generateVerts() {
		if(this.type == 0) return [];
		const roadZ = this.type == 3 ? 2.0 : 0.1;

		const size0 = this.intersection0.getSize();
		const size1 = this.intersection1.getSize();

		const texBySize = [
			null,
			new TexSpec(0, 1, 3, 2),
			new TexSpec(6, 2, 9, 4),
			new TexSpec(12.5, 6, 15.5, 9),
		];

		const sideBySize = [
			null,
			new TexSpec(0, 0, 0, 0, 149, 149, 149),
			new TexSpec(0, 0, 0, 0, 149, 149, 149),
			new TexSpec(8, 1, 9, 2),
		];

		const [xMin, xMax, yMin, yMax] = this.bounds();

		return building(
			new Vert(xMin, yMin, 0),
			new Vert(xMax, yMax, roadZ),
			sideBySize[this.type],
			texBySize[this.type],
			this.isNS
		);
	}

	setType(t) {
		this.type = t;
		this.markDirty();

		if(this.intersection0.getConnectionConfig()[1] == "3130") {
			this.intersection0.convertTo3131();
		}
		if(this.intersection1.getConnectionConfig()[1] == "3130") {
			this.intersection1.convertTo3131();
		}

		this.intersection0.regen();
		this.intersection1.regen();
	}

	mustBe0() {
		return this.intersection0.getConnectionConfig()[1] == "3300" ||
			this.intersection1.getConnectionConfig()[1] == "3300";
	}
}

class Building extends Renderable{
	constructor(x, y, dx, dy, height) {
		super();

		this.x = x;
		this.y = y;
		this.dx = dx;
		this.dy = dy;
		this.height = height;
	}

	generateVerts() {
		// return objectToVertArray("building");
		return building(
	        new Vert(this.x, this.y, 0),
	        new Vert(this.x+this.dx, this.y+this.dy, this.height),
			new TexSpec(0, 2, 1, 6),
			new TexSpec(2, 2, 3, 3, 255, 255, 255),
	    );
	}
}

class Base extends Renderable{
	constructor(world) {
		super();
		this.world = world;
	}

	generateVerts() {
		const zoneColors = [
			[26, 223, 26],
			[255, 0, 255], // res
			[255, 255, 0], // ind
			[0, 0, 255], // comm
			[26, 223, 26], // green
		];
		const verts = [];
		for(let x=0; x < 11; x++) {
			for(let y=0; y < 11; y++) {
				let [r, g, b] = zoneColors[world.zoning[x][y]];
				verts.push.apply(verts, square(
					new Vert(x*10-55, y*10-55, 0, r, g, b, 13.25, 1.25),
					new Vert(x*10-45, y*10-55, 0, r, g, b, 15.75, 1.25),
					new Vert(x*10-45, y*10-45, 0, r, g, b, 15.75, 3.75),
					new Vert(x*10-55, y*10-45, 0, r, g, b, 13.25, 3.75)
				));
			}
		}
		return verts;
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

async function wait(f = 1) {
	if(!doWaits) return;
	await new Promise(resolve => setTimeout(resolve, f*100));
}

function rand(min, max) {
	return Math.floor(Math.random()*(max-min+1)) + min;
}

function randBool(p=0.5) {
	return Math.random() < p;
}

class World{
	constructor() {
		this.reset();
	}

	render() {
		this.base.render();
		this.nsRoads.forEach(a => a.forEach(r => r.render()));
		this.ewRoads.forEach(a => a.forEach(r => r.render()));
		this.intersections.forEach(a => a.forEach(i => i.render()));
		this.buildings.forEach(b => b.render());
	}

	reset() {
		const minorWidth = 110;
		const minorHeight = 110;

		const interMax = 12;

		// grid used when generating buildings
		this.gridFilled = makeArray(minorWidth, minorHeight, () => false);
		this.zoning = makeArray(11, 11, () => 0);

		const nullRoad = new Road();
		nullRoad.type = 0;

		this.nsRoads = makeArray(interMax, interMax-1, (x, y) => new Road(true, x, y)); // [x - 10][y - 9]
		this.ewRoads = makeArray(interMax-1, interMax, (x, y) => new Road(false, x, y)); // [x - 10][y - 9]
		this.intersections = makeArray(interMax, interMax, (x, y) => {
			const nRoad = y == interMax-1 ? nullRoad : this.nsRoads[x][y];
			const sRoad = y == 0 ? nullRoad : this.nsRoads[x][y-1];
			const eRoad = x == interMax-1 ? nullRoad : this.ewRoads[x][y];
			const wRoad = x == 0 ? nullRoad : this.ewRoads[x-1][y];

			return new Intersection(x, y, nRoad, sRoad, eRoad, wRoad);
		});

		this.buildings = [];
		this.base = new Base();
	}

	async generate() {
		/* 1. Add highways */
		const highwayX = rand(4, 7);
		const highwayY = rand(4, 7);
		await this.addHighway(highwayX, highwayY, randBool(), randBool());

		/* 2. Add big roads */
		const bigRoadProb = 0.4;

		for(let y=2; y<9; y++) {
			if(y != highwayY && randBool(bigRoadProb)) {
				await this.addHorizontalRoad(y);
				y++; // skip the next one to avoid weird highway ramps
			}
		}

		for(let x=2; x<9; x++) {
			if(x != highwayX && randBool(bigRoadProb)) {
				await this.addVerticalRoad(x);
				x++; // skip the next one to avoid weird highway ramps
			}
		}

		/* 3. Fill in the smaller roads */
		const smallRoadSkipProb = 0.15;

		for(let i=1; i<11; i++) {
			for(let j=1; j<10; j++) {
				const r = this.nsRoads[i][j];
				if(i == 1 || i == 10) {
					// pass
				} else if(
					randBool(smallRoadSkipProb)
					|| r.type != 0
					|| r.mustBe0()
				) {
					continue;
				}
				r.setType(1);
				await wait(0.5);
			}
		}

		for(let j=1; j<11; j++) {
			for(let i=1; i<10; i++) {
				const r = this.ewRoads[i][j];
				if(j == 1 || j == 10) {
					// pass
				} else if(
					randBool(smallRoadSkipProb)
					|| r.type != 0
					|| r.mustBe0()
				) {
					continue;
				}
				r.setType(1);
				await wait(0.5);
			}
		}

		/* 4. Add roundabouts */
		const roundaboutMaxProb = 1.0;
		for(let i=1; i<10; i++) {
			for(let j=1; j<10; j++) {
				const inter = this.intersections[i][j];
				if(inter.getConnectionConfig()[1] == "1111") {
					const prob = Math.max(Math.abs(5 - i), Math.abs(5 - j)) / 4 * roundaboutMaxProb;
					if(randBool(prob)) {
						inter.setType(1);
						await wait(0.5);
					}
				}
			}
		}

		/* 5. Zoning */
		const choicesByRing = [
			// relative prob of each zone type
			// residential, industrial, commercial, green space
			[0, 0, 4, 2],
			[0, 1, 4, 1],
			[2, 1, 3, 1],
			[6, 2, 2, 1],
			[6, 1, 2, 1],
		].map(probs => {
			const choices = [];
			probs.forEach((p, i) => {
				for(let n=0; n<p; n++) {
					choices.push(i+1);
				}
			});
			return choices;
		});
		for(let x=1; x<10; x++) {
			for(let y=1; y<10; y++) {
				const ring = Math.max(Math.abs(5 - x), Math.abs(5 - y));
				const choices = choicesByRing[ring];
				const zone = choices[rand(0, choices.length - 1)];
				this.zoning[x][y] = zone;
				this.base.markDirty();
				await wait(0.25);
			}
		}

		/* 6. Set gridFilled */
		this.intersections.forEach(set => set.forEach(i => {
			const s = i.getSize();
			for(let x = i.xIndex*10 - s; x < i.xIndex*10 + s; x++) {
				for(let y = i.yIndex*10 - s; y < i.yIndex*10 + s; y++) {
					this.gridFilled[x][y] = true;
				}
			}
		}));
		this.nsRoads.forEach(set => set.forEach(r => {
			if(r.type == 0) return;
			const [xMin, xMax, yMin, yMax] = r.bounds();
			for(let x = xMin; x < xMax; x++) {
				for(let y = yMin; y < yMax; y++) {
					this.gridFilled[x+55][y+55] = true;
				}
			}
		}));
		this.ewRoads.forEach(set => set.forEach(r => {
			if(r.type == 0) return;
			const [xMin, xMax, yMin, yMax] = r.bounds();
			for(let x = xMin; x < xMax; x++) {
				for(let y = yMin; y < yMax; y++) {
					this.gridFilled[x+55][y+55] = true;
				}
			}
		}));

		/* 7. Add buildings */
		for(let x=1; x<10; x++) {
			for(let y=1; y<10; y++) {
				const zone = this.zoning[x][y];
				await this.addBuildings(zone, x*10, y*10, x*10+10, y*10+10);
			}
		}

		/* 8. Make the ground look normal */
		this.zoning = makeArray(11, 11, () => 0);
		this.base.markDirty();
	}

	async addBuildings(zoneType, xmin, ymin, xmax, ymax) {
								  // null, res, ind, com, green
		const maxSizeByZoneType = [1, 2, 4, 3, 1];

		for(let x=xmin; x<xmax; x++) {
			for(let y=ymin; y<ymax; y++) {
				if(this.gridFilled[x][y]) continue;

				// determine the max building size we can put here
				let maxSize = Math.min(xmax - x, ymax - y);
				maxSize = Math.min(maxSize, maxSizeByZoneType[zoneType]);
				while(!this.groundClear(x, y, maxSize)) {
					maxSize--;
				}

				const size = rand(1, maxSize);
				this.addBuilding(x-55, y-55, size, zoneType);
				this.fillGround(x, y, size);
				await wait(0);
			}
		}
	}

	addBuilding(x, y, size, zoneType) {
		switch(zoneType) {
			case 1: // res
				// this.buildings.push(new House(x, y));
				break;
			case 2: // ind
				break;
			case 3: // com
				const centerness = Math.pow(1 - Math.sqrt(x*x+y*y)/64, 4);
				const height = 2 + rand(centerness*15, centerness*40);
				this.buildings.push(new Building(x, y, size, size, height));
				break;
			case 4: // green
				// this.buildings.push(new Tree(x, y));
				break;
		}
	}

	groundClear(x, y, s) {
		for(let i=0; i<s; i++) {
			for(let j=0; j<s; j++) {
				if(this.gridFilled[x+i][y+j]) return false;
			}
		}
		return true;
	}

	fillGround(x, y, s) {
		for(let i=0; i<s; i++) {
			for(let j=0; j<s; j++) {
				this.gridFilled[x+i][y+j] = true;
			}
		}
	}

	async addHighway(x, y, xflipped, yflipped) {
		if(yflipped) {
			for(let i=this.nsRoads[0].length-1; i+1>y; i--) {
				this.nsRoads[x][i].setType(3);
				await wait();
			}
		} else {
			for(let i=0; i<y; i++) {
				this.nsRoads[x][i].setType(3);
				await wait();
			}
		}

		if(xflipped) {
			for(let i=x-1; i>=0; i--) {
				this.ewRoads[i][y].setType(3);
				await wait();
			}
		}else{
			for(let i=x; i<this.ewRoads[0].length-1; i++) {
				this.ewRoads[i][y].setType(3);
				await wait();
			}
		}
	}

	async addHorizontalRoad(y) {
		for(let i=1; i<10; i++) {
			this.ewRoads[i][y].setType(2);
			await wait();
		}
	}

	async addVerticalRoad(x) {
		for(let i=1; i<10; i++) {
			this.nsRoads[x][i].setType(2);
			await wait();
		}
	}
}
