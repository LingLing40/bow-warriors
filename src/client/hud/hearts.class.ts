import {Scene, Container, Sprite} from '../game/types';
import {LayerDepth} from '../game/settings';

export class Hearts {

	private healthDisplay: Container;
	private health: number = 0;
	private heartSize: number = 16;

	constructor (scene: Scene, private maxHealth: number) {
		this.health = maxHealth;
		this.healthDisplay = scene.add.container(this.heartSize, this.heartSize);
		const hearts: Sprite[] = [];
		let heart: Sprite;
		for (let i = 0; i < maxHealth; i++) {
			heart = scene.add.sprite(this.heartSize * i + this.heartSize / 4 * i, 0, 'heart');
			heart
				.setFrame(0)
				.setScale(this.heartSize / heart.width);
			hearts.push(heart);
		}
		this.healthDisplay
			.setScrollFactor(0)
			.setDepth(LayerDepth.HEARTS)
			.add(hearts);
	}

	public update (health: number): void {
		this.health = health;
		let count = 0;
		this.healthDisplay.iterate((heart: Sprite) => {
			if (count < health) {
				heart.setFrame(0);
			} else {
				heart.setFrame(1);
			}
			count++;
		});
	}
}
