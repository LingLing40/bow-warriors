import {Group, Scene, Sprite} from '../game/types';
import {ArrowData} from '../../shared/models';

export class Arrow {
	public arrow: Sprite;
	public id: string;
	public readonly baseVelocity: number = 350;
	private group: Group;

	constructor (scene: Scene, data: ArrowData, group: Group) {
		this.id = data.id;
		this.group = group;
		this.arrow = group.create(data.x, data.y, 'arrow');

		// turn collider body for vertical direction
		if (data.posDiffY !== 0) {
			this.arrow.body.setSize(this.arrow.displayHeight, this.arrow.displayWidth, true);
		}

		this.arrow.x += data.posDiffX * (this.arrow.width / 2);
		this.arrow.y += data.posDiffY * (this.arrow.width / 2);
		this.arrow.setData('id', data.id);
		this.arrow.setData('playerId', data.playerId);
		this.arrow.setBounce(0.05);
		this.arrow.setCollideWorldBounds(true);
		this.arrow.setAngle(data.angle);
	}

	public destroy () {
		this.group.remove(this.arrow, true, true);
	}
}
