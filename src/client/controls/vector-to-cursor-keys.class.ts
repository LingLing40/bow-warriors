import KeyCodes = Phaser.Input.Keyboard.KeyCodes;

const GetValue = (Phaser.Utils as any).Objects.GetValue;
const Key = Phaser.Input.Keyboard.Key;
const GetDist = Phaser.Math.Distance.Between;
const GetAngle = Phaser.Math.Angle.Between;
const RadToDeg = Phaser.Math.RadToDeg;

/**
 * Code copied and adjusted from: phaser3-rex-plugins
 * License: MIT, Author: @rexrainbow (github)
 */
class VectorToCursorKeys {

	public start;
	public end;
	public noKeyDown;
	public cursorKeys;
	public enable;
	public dirMode;
	public forceMin;

	constructor(config) {
		this.resetFromJSON(config);
	}

	/**
	 * Reset status by JSON object
	 * @param {object} o JSON object
	 * @returns {object} this object
	 */
	resetFromJSON(o) {
		if (this.start == undefined) {
			this.start = {};
		}
		if (this.end == undefined) {
			this.end = {};
		}
		this.noKeyDown = GetValue(o, 'noKeyDown', true);
		if (this.cursorKeys == undefined) {
			this.cursorKeys = {
				up: new Key(KeyCodes.UP),
				down: new Key(KeyCodes.DOWN),
				left: new Key(KeyCodes.LEFT),
				right: new Key(KeyCodes.RIGHT)
			}
		}

		this.setEnable(GetValue(o, 'enable', true));
		this.setMode(GetValue(o, 'dir', '8dir'));
		this.setDistanceThreshold(GetValue(o, 'forceMin', 16));

		let startX = GetValue(o, "start.x", null);
		let startY = GetValue(o, "start.y", null);
		let endX = GetValue(o, "end.x", null);
		let endY = GetValue(o, "end.y", null);
		this.setVector(startX, startY, endX, endY);
		return this;
	}

	/**
	 * Return status in JSON object
	 * @returns JSON object
	 */
	toJSON() {
		return {
			enable: this.enable,
			dir: this.dirMode,
			forceMin: this.forceMin,

			noKeyDown: this.noKeyDown,
			start: {
				x: this.start.x,
				y: this.start.y
			},
			end: {
				x: this.end.x,
				y: this.end.y
			}
		};
	}

	/**
	 * Set direction mode
	 * @param {number|string} m 'up&down'(0), 'left&right'(1), '4dir'(2), or '8dir'(3)
	 * @returns {object} this object
	 */
	setMode(m) {
		if (typeof (m) === 'string') {
			m = DIRMODE[m];
		}
		this.dirMode = m;
		return this;
	}

	setEnable(e) {
		if (e == undefined) {
			e = true;
		} else {
			e = !!e;
		}
		if (e === this.enable) {
			return;
		}
		if (e === false) {
			this.cleanVector();
		}
		this.enable = e;
	}

	setDistanceThreshold(d) {
		if (d < 0) {
			d = 0;
		}
		this.forceMin = d;
		return this;
	}

	createCursorKeys() {
		return this.cursorKeys;
	}

	setKeyState(keyName, isDown) {
		let key = this.cursorKeys[keyName];

		if (!key.enabled) {
			return;
		}

		let isUp = !isDown;
		key.isDown = isDown;
		key.isUp = isUp;
		if (isDown) {
			this.noKeyDown = false;
		}
	}

	getKeyState(keyName) {
		return this.cursorKeys[keyName];
	}

	cleanVector() {
		this.start.x = 0;
		this.start.y = 0;
		this.end.x = 0;
		this.end.y = 0;
		this.noKeyDown = true;
		for (let keyName in this.cursorKeys) {
			this.setKeyState(keyName, false);
		}

		return this;
	}

	setVector(x0, y0, x1, y1) {
		this.cleanVector();
		if (!this.enable) {
			return this;
		}
		if (x0 === null) {
			return this;
		}

		this.start.x = x0;
		this.start.y = y0;
		this.end.x = x1;
		this.end.y = y1;
		if (this.force < this.forceMin) {
			return this;
		}

		let angle = (360 + this.angle) % 360;
		let keyName;
		switch (this.dirMode) {
			case 0: // up & down
				keyName = (angle < 180) ? 'down' : 'up';
				this.setKeyState(keyName, true);
				break;
			case 1: // left & right
				keyName = ((angle > 90) && (angle <= 270)) ? 'left' : 'right';
				this.setKeyState(keyName, true);
				break;
			case 2: // 4 dir
				keyName =
					((angle > 45) && (angle <= 135)) ? 'down' :
						((angle > 135) && (angle <= 225)) ? 'left' :
							((angle > 225) && (angle <= 315)) ? 'up' :
								'right';
				this.setKeyState(keyName, true);
				break;
			case 3: // 8 dir
				if ((angle > 22.5) && (angle <= 67.5)) {
					this.setKeyState('down', true);
					this.setKeyState('right', true);
				} else if ((angle > 67.5) && (angle <= 112.5)) {
					this.setKeyState('down', true);
				} else if ((angle > 112.5) && (angle <= 157.5)) {
					this.setKeyState('down', true);
					this.setKeyState('left', true);
				} else if ((angle > 157.5) && (angle <= 202.5)) {
					this.setKeyState('left', true);
				} else if ((angle > 202.5) && (angle <= 247.5)) {
					this.setKeyState('left', true);
					this.setKeyState('up', true);
				} else if ((angle > 247.5) && (angle <= 292.5)) {
					this.setKeyState('up', true);
				} else if ((angle > 292.5) && (angle <= 337.5)) {
					this.setKeyState('up', true);
					this.setKeyState('right', true);
				} else {
					this.setKeyState('right', true);
				}
				break;
		}

		return this;
	}

	get forceX() {
		return this.end.x - this.start.x;
	}

	get forceY() {
		return this.end.y - this.start.y;
	}

	get force() {
		return GetDist(this.start.x, this.start.y, this.end.x, this.end.y);
	}

	get rotation() {
		return GetAngle(this.start.x, this.start.y, this.end.x, this.end.y);
	}

	get angle() {
		return RadToDeg(this.rotation);; // -180 ~ 180
	}

	get octant() {
		let octant = 0;
		if (this.rightKeyDown) {
			octant = (this.downKeyDown) ? 45 : 0;
		} else if (this.downKeyDown) {
			octant = (this.leftKeyDown) ? 135 : 90;
		} else if (this.leftKeyDown) {
			octant = (this.upKeyDown) ? 225 : 180;
		} else if (this.upKeyDown) {
			octant = (this.rightKeyDown) ? 315 : 270;
		}
		return octant;
	}

	get upKeyDown() {
		return this.cursorKeys.up.isDown;
	}

	get downKeyDown() {
		return this.cursorKeys.down.isDown;
	}

	get leftKeyDown() {
		return this.cursorKeys.left.isDown;
	}

	get rightKeyDown() {
		return this.cursorKeys.right.isDown;
	}

	get anyKeyDown() {
		return !this.noKeyDown;
	}
}

/** @private */
const DIRMODE = {
	'up&down': 0,
	'left&right': 1,
	'4dir': 2,
	'8dir': 3
};

export default VectorToCursorKeys;