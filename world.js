class World{
	constructor() {
		const minorWidth = 110;
		const minorHeight = 110;

		// grid used when generating buildings
		this.gridFilled = [];
		for(let i=0; i<minorWidth; i++) {
			this.gridFilled[i] = [];
			for(let j=0; j<minorHeight; j++) {
				this.gridFilled[i][j] = false;
			}
		}

	}

	render() {
		drawBase();
	}

	async generate() {

	}
}
