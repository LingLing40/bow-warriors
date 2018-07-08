import {Scene, Text} from '../game/types';
import {Player} from '../actors/player/player.class';

export class Hud {

	private name: Text;
	private style: { font, fill, align };

	constructor (scene: Scene, player: Player) {
		this.style = {
			font: '10px Arial',
			fill: '#ffffff',
			align: 'center'
		};

		this.name = scene.add.text(0, 0, player.name.substring(0, 6), this.style);
		this.name.setOrigin(0.5, 0);
		this.setCoordinates(player);
	}

	public setCoordinates (player: Player): void {
		const center: Phaser.Math.Vector2 = player.player.getCenter();
		this.name.x = center.x;
		this.name.y = center.y + player.player.height / 2;
	}
}