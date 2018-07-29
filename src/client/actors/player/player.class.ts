/*
import {KeyBoardControl} from '../../controls/keyboard.class';
import {Projectile} from '../../props/powers/projectile/projectile.class';
import {Hud} from '../../hud/hud.class';
import {Particle} from '../../props/particle/particle.class';
import {SpaceShip} from '../../../shared/models';
import {Explode} from '../../props/explosion/explosion.class';
*/
import {Group, Scene, ArcadeSprite, ArcadeImage, Graphics} from '../../game/types';
import {Character, CharacterAnimation, PlayerCoordinates, PlayerData, Team} from '../../../shared/models';
import {AnimationHandler} from '../../game/animation.handler';
import {Hud} from '../../hud/hud.class';
import {LayerDepth} from '../../game/settings';
import {TeamColors} from '../../../shared/config';

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
		this.arrowHitbox.body
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
		this.player.setBounce(0.2);
		this.player.setCollideWorldBounds(true);
		this.player.setFrame(130);
		this.player.setDepth(LayerDepth.PLAYER);

		this.hud = new Hud(scene, this);
	}

	public updateMovement (data: PlayerCoordinates): void {
		this.setCoordinates(data.x, data.y);
		if (data.animation) {
			this.animate(data.animation);
		}
	}

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
	}

	/*
	public player: Phaser.ArcadeSprite;
	public projectile: Projectile;
	public controls: KeyBoardControl;
	public playerState: Map<string, boolean | number>;
	public hud: Hud;
	public angularVelocity: number = 300;
	private particle: Particle;

	constructor(private gameInstance: Phaser.Game,
							public playerInstance: SpaceShip, type) {
			this.createPlayer(this.gameInstance, type);
			this.playerState = new Map();
	}

	public createPlayer(gameInstance, type): void {
			this.hud = new Hud();
			this.addControls();
			this.player = gameInstance.add.sprite(this.playerInstance.x, this.playerInstance.y, type);
			this.player.id = this.playerInstance.id;
			this.player.anchor.setTo(0.5, 0.5);
			this.player.animations.add('accelerating', [1, 0], 60, false);
			this.player.name = this.playerInstance.name;
			this.attachPhysics(gameInstance);
			this.player.destroy = () => {
					new Explode(this.gameInstance, this.player);
					this.player.kill();
			};
			this.hud.setName(gameInstance, this.player);
			this.particle = new Particle(gameInstance, this.player);
	}

	public assignPickup(game, player?): void {
			this.projectile = new Projectile(game, player.player);
			this.hud.setAmmo(game, player.player, this.projectile);
			this.playerState.set('ammo', this.projectile.bulletCount);
	}

	public view(): void {
			this.controls.update();
			if (this.projectile) {
					this.hud.update(this.playerState.get('ammo'));
			}
	}

	private addControls(): void {
			this.controls = new KeyBoardControl(this.gameInstance, this);
	}

	private attachPhysics(gameInstance): void {
			gameInstance.physics.enable(this.player, Phaser.Physics.ARCADE);
			this.player.body.collideWorldBounds = true;
			this.player.body.bounce.setTo(10, 10);
			this.player.body.gravity.y = 0;
			this.player.body.drag.set(80);
			this.player.body.maxVelocity.set(100);
			this.player.body.immovable = false;
	}
	*/
}
