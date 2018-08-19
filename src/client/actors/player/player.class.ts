import {Group, Scene, ArcadeSprite, ArcadeImage, Graphics} from '../../game/types';
import {Character, CharacterAnimation, PlayerCoordinates, PlayerData, Team} from '../../../shared/models';
import {AnimationHandler} from '../../game/animation.handler';
import {Hud} from '../../hud/hud.class';
import {LayerDepth} from '../../game/settings';
import {TeamColors} from '../../../shared/config';
import Body = Phaser.Physics.Arcade.Body;

export class Player {
	public player: ArcadeSprite;
	public arrowHitbox: ArcadeImage;
	public lastDirection: string = 'down';
	public isShooting: boolean = false;
	public health;
	public character: Character;
	public team: Team;
	public id: string;
	public name: string;
	public readonly baseVelocity: number = 150;
	private readonly bodySizeX: number = 20;
	private readonly bodySizeY: number = 15;
	private readonly bodySizeYOffset: number = 25;
	private readonly hitboxBodySizeX: number = 30;
	private readonly hitboxBodySizeY: number = 48;
	private readonly hitboxBodySizeYOffset: number = - 20;
	private readonly shadowSizeX: number = 30;
	private readonly shadowSizeY: number = 8;
	private readonly shadowOffsetY: number = 30;
	private group: Group;
	private hud: Hud;
	private shadow: Graphics;
	private blinkTimer: Phaser.Time.TimerEvent;

	constructor (scene: Scene, data: PlayerData, group?: Group, hitboxGroup?: Group) {
		this.id = data.id;
		this.health = data.health;
		this.character = data.character;
		this.name = data.name;
		this.team = data.team;

		if (group) {
			this.player = group.create(data.x, data.y, data.character);
			this.group = group;
		} else {
			this.player = scene.physics.add.sprite(data.x, data.y, data.character);
		}

		// set player color tint
		const colorTint = TeamColors[this.team];
		if (colorTint) {
			this.player.setTint(colorTint);
		}

		AnimationHandler.add(scene, data.character);

		// add hitbox for world
		const bodyOffsetX = (this.player.width / 2) - (this.bodySizeX / 2);
		const bodyOffsetY = (this.player.height / 2) - (this.bodySizeY / 2) + this.bodySizeYOffset;

		this.player.body
			.setSize(this.bodySizeX, this.bodySizeY)
			.setOffset(bodyOffsetX, bodyOffsetY);

		// add hitbox for arrows
		this.arrowHitbox = scene.physics.add.image(data.x, data.y, 'transparent');
		this.arrowHitbox.setData('id', data.id);
		(this.arrowHitbox.body as Body)
			.setSize(this.hitboxBodySizeX, this.hitboxBodySizeY)
			.setOffset(- this.hitboxBodySizeX / 2, this.hitboxBodySizeYOffset);

		if (hitboxGroup) {
			hitboxGroup.add(this.arrowHitbox);
		}

		// draw shadow
		this.shadow = scene.add.graphics();
		this.shadow.setPosition(this.player.x, this.player.y + this.hitboxBodySizeY / 2)
			.setAlpha(0.5)
			.fillEllipse(0, 0, this.shadowSizeX, this.shadowSizeY, );

		this.player.setData('id', data.id);
		this.player.setBounce(0);
		this.player.setCollideWorldBounds(true);
		this.player.setFrame(130);
		this.player.setDepth(LayerDepth.PLAYER);

		this.hud = new Hud(scene, this);
	}

	public updateMovement (data: PlayerCoordinates): void {
		this.setCoordinates(data.x, data.y);
		this.setVelocity(data.velocityX, data.velocityY);
		if (data.animation) {
			this.animate(data.animation);
		}
	}

	public setVelocity(velocityX: number, velocityY: number): void {
		this.player.setVelocity(velocityX, velocityY);
		if (velocityX === 0 && velocityY === 0) {
			this.arrowHitbox.setVelocity(0, 0);
			this.arrowHitbox.setVelocity(0, 0);
		}
	}

	/*
	public setVelocityX(velocityX: number):void {
		this.player.setVelocityX(velocityX);
		this.arrowHitbox.setVelocityX(velocityX);
	}
	*/

	public setCoordinates (x: number, y: number): void {
		this.player.x = x;
		this.player.y = y;
		this.updateOtherCoordinates();
	}

	public updateOtherCoordinates (): void {
		this.arrowHitbox.x = this.player.getCenter().x;
		this.arrowHitbox.y = this.player.getCenter().y;
		this.shadow.x = this.player.getCenter().x;
		this.shadow.y = this.player.getCenter().y + this.shadowOffsetY;
		this.hud.setCoordinates(this);
	}

	public animate (key: CharacterAnimation | string, ignoreIfPlaying = true): void {
		AnimationHandler.play(this, key, ignoreIfPlaying);
	}

	public blink (scene: Scene): void {
		if (this.blinkTimer && this.blinkTimer.getOverallProgress() < 6) {
			this.blinkTimer.remove(null);
		}

		this.player.setVisible(true);
		this.blinkTimer = scene.time.addEvent({
			delay: 150,
			repeat: 5,
			callback: this.toggleVisibility,
			callbackScope: this
		});
	}

	private toggleVisibility (): void {
		this.player.setVisible(!this.player.visible);
	}

	public destroy (): void {
		if (this.group) {
			this.group.remove(this.player, true, true);
		} else {
			this.player.destroy();
		}
		this.hud.destroy();
		this.shadow.destroy();
		this.arrowHitbox.destroy();
	}
}
