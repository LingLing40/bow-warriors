/*
import {KeyBoardControl} from '../../controls/keyboard.class';
import {Projectile} from '../../props/powers/projectile/projectile.class';
import {Hud} from '../../hud/hud.class';
import {Particle} from '../../props/particle/particle.class';
import {SpaceShip} from '../../../shared/models';
import {Explode} from '../../props/explosion/explosion.class';
*/
import {Group, Scene, Sprite} from '../../game/types';
import {Character, CharacterAnimation, PlayerCoordinates, PlayerData} from '../../../shared/models';
import {AnimationHandler} from '../../game/animation.handler';

export class Player {
	public player: Sprite;
	public lastDirection: string = 'down';
	public isShooting: boolean = false;
	public health = 3;
	public character: Character;
	public id: string;
	public readonly baseVelocity: number = 150;
	private readonly bodySizeX: number = 30;
	private readonly bodySizeY: number = 50;
	private group: Group;

	constructor (scene: Scene, data: PlayerData, group?: Group) {
		this.id = data.id;
		this.health = data.health;
		this.character = data.character;

		if (group) {
			this.player = group.create(data.x, data.y, data.character);
			this.group = group;
		} else {
			this.player = scene.physics.add.sprite(data.x, data.y, data.character);
		}

		AnimationHandler.add(scene, data.character);

		const bodyOffsetX = (this.player.width / 2) - (this.bodySizeX / 2);
		const bodyOffsetY = (this.player.height / 2) - (this.bodySizeY / 2) + 5;

		this.player.body
			.setSize(this.bodySizeX, this.bodySizeY)
			.setOffset(bodyOffsetX, bodyOffsetY);

		this.player.setData('id', data.id);
		this.player.setBounce(0.2);
		this.player.setCollideWorldBounds(true);
		this.player.setFrame(130);
	}

	public setCoordinates (data: PlayerCoordinates): void {
		this.player.x = data.x;
		this.player.y = data.y;
		if (data.animation) {
			this.animate(data.animation);
		}
	}

	public animate (key: CharacterAnimation | string, ignoreIfPlaying = true): void {
		AnimationHandler.play(this, key, ignoreIfPlaying);
	}

	public destroy (): void {
		if (this.group) {
			this.group.remove(this.player, true, true);
		} else {
			this.player.destroy();
		}
	}

	/*
	public player: Phaser.Sprite;
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
