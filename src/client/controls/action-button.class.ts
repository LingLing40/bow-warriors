import {Scene, Container, Sprite, Graphics, Text} from '../game/types';
import {LayerDepth} from '../game/settings';
import Key = Phaser.Input.Keyboard.Key;
import KeyCodes = Phaser.Input.Keyboard.KeyCodes;

export class ActionButton {

	private button: Container;
	private circle: Graphics;
	private label: Text;

	public static readonly buttonSize: number = 40;
	public key: Key;

	constructor (scene: Scene, x: integer, y: integer, label: string) {

		this.button = scene.add.container(x, y);
		this.button
			.setDepth(LayerDepth.ACTION_BUTTON)
			.setScrollFactor(0)
			.setInteractive(new Phaser.Geom.Circle(0, 0, ActionButton.buttonSize), Phaser.Geom.Circle.Contains);

		this.circle = scene.add.graphics();
		this.circle
			.fillStyle(0xffffff)
			.lineStyle(3, 0xffffff)
			.fillCircle(0, 0, ActionButton.buttonSize)
			.strokeCircle(0, 0, ActionButton.buttonSize)
			.setAlpha(0.6);
		this.button.add(this.circle);

		this.label = scene.add.text(0, 0, label, {
			font: 'bold 16px Arial',
			fill: '#333333',
			align: 'center'
		});
		this.label.setOrigin(0.5);
		this.button.add(this.label);

		this.key = new Key(KeyCodes.S);
		this.keyUp();

		// events
		this.button.on('pointerdown', this.keyDown, this);
		this.button.on('pointerup', this.keyUp, this);
	}

	private keyDown () {
		if (!this.key.isDown) {
			this.key.isDown = true;
			this.key.isUp = false;
			this.key.timeDown = Date.now();
			this.circle.setAlpha(0.8);
		}
	}

	private keyUp () {
		if (!this.key.isUp) {
			this.key.isUp = true;
			this.key.isDown = false;
			this.key.timeUp = Date.now();
			this.circle.setAlpha(0.6);
		}
	}

	public setEnable (enable: boolean) {
		this.button.setVisible(enable);
		this.key.enabled = enable;

		if (!enable) {
			this.keyUp();
		}
	}
}