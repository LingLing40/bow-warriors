import {Group, Scene, ArcadeImage} from '../game/types';
import {ArrowData} from '../../shared/models';
import {LayerDepth} from '../game/settings';
import {TeamColors} from '../../shared/config';
import Body = Phaser.Physics.Arcade.Body;

export class Arrow {
	public arrow: ArcadeImage;
	public id: string;
	public readonly baseVelocity: number = 350;
	private group: Group;

	constructor (scene: Scene, data: ArrowData, group: Group) {
		this.id = data.id;
		this.group = group;
		this.arrow = group.create(data.x, data.y, 'arrow');

		// rotate collider body for vertical direction
		if (data.posDiffY !== 0) {
			(this.arrow.body as Body).setSize(this.arrow.displayHeight, this.arrow.displayWidth, true);
		}

		// set player color tint
		const colorTint = TeamColors[data.team];
		if (colorTint) {
			this.arrow.setTint(colorTint);
		}

		this.arrow.x += data.posDiffX * (this.arrow.width / 2);
		this.arrow.y += data.posDiffY * (this.arrow.width / 2);
		this.arrow.setData('id', data.id);
		this.arrow.setData('playerId', data.playerId);
		this.arrow.setBounce(0.05);
		this.arrow.setCollideWorldBounds(true);
		this.arrow.setAngle(data.angle);
		this.arrow.setDepth(LayerDepth.ARROW);
	}

	public destroy () {
		this.group.remove(this.arrow, true, true);
	}
}
