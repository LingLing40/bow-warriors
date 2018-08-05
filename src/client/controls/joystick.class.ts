import TouchCursor from './touch-cursor.class';
import {Scene} from '../game/types';

// tslint:disable-next-line
const GetValue = Phaser.Utils.Objects.GetValue;

/**
 * Code copied and adjusted from: phaser3-rex-plugins
 * License: MIT, Author: @rexrainbow (github)
 */
export class VirtualJoyStick {

	public scene: Scene;
	public base: Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics;
	public thumb: Phaser.GameObjects.Sprite | Phaser.GameObjects.Graphics;
	public radius: number;
	public touchCursor: TouchCursor;

	constructor(scene, config) {
		this.scene = scene;
		this.radius = GetValue(config, 'radius', 100);

		this.addBase(GetValue(config, 'base', undefined), config);
		this.addThumb(GetValue(config, 'thumb', undefined), config);

		let x = GetValue(config, 'x', 0);
		let y = GetValue(config, 'y', 0);
		this.base.setPosition(x, y);
		this.thumb.setPosition(x, y);

		this.boot();
	}

	createCursorKeys() {
		return this.touchCursor.createCursorKeys();
	}

	get forceX() {
		return this.touchCursor.forceX;
	}

	get forceY() {
		return this.touchCursor.forceY;
	}

	get force() {
		return this.touchCursor.force;
	}

	get rotation() {
		return this.touchCursor.rotation;
	}

	get angle() {
		return this.touchCursor.angle; // -180 ~ 180
	}

	get up() {
		return this.touchCursor.upKeyDown;
	}

	get down() {
		return this.touchCursor.downKeyDown;
	}

	get left() {
		return this.touchCursor.leftKeyDown;
	}

	get right() {
		return this.touchCursor.rightKeyDown;
	}

	get noKey() {
		return this.touchCursor.noKeyDown;
	}

	get pointerX() {
		return this.touchCursor.end.x;
	}

	get pointerY() {
		return this.touchCursor.end.y;
	}

	get pointerId() {
		return this.touchCursor.pointerId;
	}

	setPosition(x, y) {
		this.x = x;
		this.y = y;
		return this;
	}

	set x(x) {
		this.base.x = x;
	}

	set y(y) {
		this.base.y = y;
	}

	get x() {
		return this.base.x;
	}

	get y() {
		return this.base.y;
	}

	setVisible(visible) {
		this.visible = visible;
		return this;
	}

	toggleVisible() {
		this.visible = !this.visible;
	}

	get visible() {
		return this.base.visible;
	}

	set visible(visible) {
		this.base.visible = visible;
		this.thumb.visible = visible;
	}

	setEnable(value) {
		this.enable = value;
		return this;
	}

	toggleEnable() {
		this.enable = !this.enable;
	}

	get enable() {
		return this.touchCursor.enable;
	}

	set enable(value) {
		this.touchCursor.setEnable(value);
	}

	on() {
		let ee = this.touchCursor.events;
		ee.on.apply(ee, arguments);
		return this;
	}

	once() {
		let ee = this.touchCursor.events;
		ee.once.apply(ee, arguments);
		return this;
	}

	addBase(gameObject, config) {
		if (this.base) {
			this.base.destroy();
			// also destroy touchCursor behavior
		}

		if (typeof gameObject === 'string') {
			gameObject = this.scene.add.sprite(0, 0, gameObject)
				.setScrollFactor(0);
		}

		if (gameObject === undefined) {
			gameObject = this.scene.add.graphics()
				.fillStyle(0xffffff)
				.lineStyle(3, 0xffffff)
				.fillCircle(0, 0, this.radius)
				.strokeCircle(0, 0, this.radius)
				.setAlpha(0.5)
				.setScrollFactor(0);
		}

		if (config.depth) {
			gameObject.setDepth(config.depth);
		}

		this.touchCursor = new TouchCursor(gameObject, config);
		this.base = gameObject;
		return this;
	}

	addThumb(gameObject, config) {
		if (this.thumb) {
			this.thumb.destroy();
		}

		if (typeof gameObject === 'string') {
			gameObject = this.scene.add.sprite(0, 0, gameObject)
				.setScrollFactor(0);
		}

		if (gameObject === undefined) {
			gameObject = this.scene.add.graphics()
				.fillStyle(0xffffff)
				.lineStyle(3, 0xffffff)
				.fillCircle(0, 0, 40)
				.strokeCircle(0, 0, 40)
				.setAlpha(0.6)
				.setScrollFactor(0);
		}

		if (config.depth) {
			gameObject.setDepth(config.depth);
		}

		this.thumb = gameObject;
		return this;
	}

	boot() {
		this.touchCursor.events.on('update', this.update, this);
	}

	destroy() {
		this.base.destroy(); // also destroy touchCursor behavior
		this.thumb.destroy();

		this.base = undefined;
		this.thumb = undefined;
		this.touchCursor = undefined;
	}

	update() {
		let touchCursor = this.touchCursor;
		if (touchCursor.anyKeyDown) {
			if (touchCursor.force > this.radius) {
				let rad = touchCursor.rotation;
				this.thumb.x = touchCursor.start.x + (Math.cos(rad) * this.radius);
				this.thumb.y = touchCursor.start.y + (Math.sin(rad) * this.radius);
			} else {
				this.thumb.x = touchCursor.end.x;
				this.thumb.y = touchCursor.end.y;
			}
		} else {
			this.thumb.x = this.base.x;
			this.thumb.y = this.base.y;
		}
		return this;
	}
}
