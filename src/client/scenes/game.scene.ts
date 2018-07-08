import {LifeCycle} from '../game/lifecycle';
import {Sprite, Group, GameObject} from '../game/types';
import {Player} from '../actors/player/player.class';
import {ArrowData, Character, CharacterAnimation, PlayerData} from '../../shared/models';
import {AnimationHandler} from '../game/animation.handler';
import {ArrowEvent, GameEvent, PlayerEvent} from '../../shared/events.model';
import {Arrow} from '../props/arrow.class';

export class GameScene extends Phaser.Scene implements LifeCycle {

	// game references
	private arrowsGroup: Group;
	private otherPlayersGroup: Group;

	// model references
	private player: Player;
	private arrows: Map<string, Arrow> = new Map();
	private otherPlayers: Map<string, Player> = new Map();

	private cursors: CursorKeys;
	private socket: SocketIOClient.Socket;

	constructor () {
		super({
			key: 'GameScene'
		});

		this.socket = io();
	}

	preload () {
		this.load.image('ground', 'assets/platform.png');
		this.load.image('arrow', 'assets/weapons/arrow.png');
		this.load.spritesheet('dude',
			'assets/characters/base.png',
			{frameWidth: 64, frameHeight: 64}
		);
	}

	create () {

		const platforms = this.physics.add.staticGroup();
		this.otherPlayersGroup = this.physics.add.group();

		platforms.create(400, 568, 'ground').setScale(2).refreshBody();

		platforms.create(600, 400, 'ground');
		platforms.create(50, 250, 'ground');
		platforms.create(750, 220, 'ground');

		// arrow
		this.arrowsGroup = this.physics.add.group();
		this.physics.add.collider(platforms, this.arrowsGroup, this.removeArrow, undefined, this);
		this.physics.add.collider(this.otherPlayersGroup, this.arrowsGroup, this.hitPlayer, undefined, this);
		this.physics.add.collider(this.otherPlayersGroup, platforms);

		// player events
		// get initial data for own player
		this.socket.on(PlayerEvent.protagonist, (playerData: PlayerData) => {
			this.player = new Player(this, playerData);
			this.physics.add.collider(this.player.player, platforms);
			this.physics.add.collider(this.player.player, this.arrowsGroup, this.hitPlayer, undefined, this);

			// camera
			/*
			const camera = this.cameras.main;
			// camera.startFollow(this.player);
			camera.centerToBounds();
			camera.setBounds(0, 0, 800, 600); // map.widthInPixels, map.heightInPixels);
			//*/
		});

		// get initial list of players
		this.socket.on(PlayerEvent.players, (players: PlayerData[]) => {
			players.forEach(playerData => {
				const otherPlayer = new Player(this, playerData, this.otherPlayersGroup);
				this.otherPlayers.set(playerData.id, otherPlayer);
			})
		});

		// when a new player joins during the game
		this.socket.on(PlayerEvent.joined, (playerData: PlayerData) => {
			const joinedPlayer = new Player(this, playerData, this.otherPlayersGroup);
			this.otherPlayers.set(playerData.id, joinedPlayer);
		});

		// an other player quits
		this.socket.on(PlayerEvent.quit, (playerId: string) => {
			if (this.otherPlayers.has(playerId)) {
				const quitPlayer = this.otherPlayers.get(playerId);
				quitPlayer.destroy();
				this.otherPlayers.delete(playerId);
			}
		});

		// new arrow was created
		this.socket.on(ArrowEvent.create, (arrowData: ArrowData) => {
			const arrow = new Arrow(this, arrowData, this.arrowsGroup);
			this.arrows.set(arrowData.id, arrow);
		});

		// request own player from server
		this.socket.emit(GameEvent.authentication,
			{
				name: 'Test' + this.socket.id,
				character: Character.DEFAULT
			});

		this.cursors = this.input.keyboard.createCursorKeys();
	}

	update (time: number, delta: number) {

		if (this.player
			&& this.cursors
			&& this.cursors.space
			&& this.cursors.up
			&& this.cursors.down
			&& this.cursors.left
			&& this.cursors.right) {

			// do not react if player is dead
			if (this.player.health === 0) {
				return;
			}

			// trigger start of shoot animation
			if (this.cursors.space.isDown) {
				this.player.isShooting = true;
				AnimationHandler.play(this.player, `shoot_${this.player.lastDirection}`, true);
				this.player.player.setVelocity(0, 0);
			}

			// check if shoot animation ended
			if (this.player.player.anims.currentAnim && AnimationHandler.getCurrent(this.player).substr(0, 5) === 'shoot') {
				if (this.player.player.anims.currentFrame.isLast) {
					this.player.isShooting = false;

					// determine arrow direction
					let angle = 0;
					let velocityX = 0;
					let velocityY = 0;
					let posDiffX = 0;
					let posDiffY = 0;
					let turnBody = false;

					switch (this.player.lastDirection) {
						case 'left':
							posDiffX = -1;
							break;
						case 'right':
							angle = 180;
							posDiffX = 1;
							break;
						case 'up':
							angle = 90;
							posDiffY = -1;
							turnBody = true;
							break;
						case 'down':
							angle = 270;
							posDiffY = 1;
							turnBody = true;
					}

					let arrowX = this.player.player.x + posDiffX * this.player.player.displayHeight / 2;
					let arrowY = this.player.player.y + posDiffY * this.player.player.displayHeight / 2;

					const arrowData: ArrowData = {
						id: null, // set by server
						playerId: this.player.id,
						x: arrowX,
						y: arrowY,
						posDiffX,
						posDiffY,
						angle
					};
					this.socket.emit(ArrowEvent.shoot, arrowData);
				}
			}

			if (this.player.isShooting) {
				return;
			}

			const now = Date.now();
			const tolerance = 1000;

			if (this.cursors.up.isDown) {
				this.player.lastDirection = 'up';
				this.player.player.setVelocityY(-1 * this.player.baseVelocity);
			} else if (this.cursors.down.isDown) {
				this.player.lastDirection = 'down';
				this.player.player.setVelocityY(this.player.baseVelocity);
			} else if (now - this.cursors.down.timeUp > tolerance
				&& now - this.cursors.down.timeUp > tolerance) {
				this.player.player.setVelocityY(0);
			}

			if (this.cursors.left.isDown) {
				this.player.lastDirection = 'left';
				this.player.player.setVelocityX(-1 * this.player.baseVelocity);
			} else if (this.cursors.right.isDown) {
				this.player.lastDirection = 'right';
				this.player.player.setVelocityX(this.player.baseVelocity);
			} else if (now - this.cursors.left.timeUp > tolerance
				&& now - this.cursors.right.timeUp > tolerance) {
				this.player.player.setVelocityX(0);
			}

			// Normalize and scale the velocity so that player can't move faster along a diagonal
			this.player.player.body.velocity.normalize().scale(this.player.baseVelocity);

			if (this.cursors.space.isDown || now - this.cursors.space.timeDown < 500 || now - this.cursors.space.timeUp < 500) {

				// shoot if space is pressed
				this.player.isShooting = true;
				const progress = this.player.player.anims.getProgress();
				if (progress === 1) {
					this.player.isShooting = false;
				}
				if (this.player.isShooting) {
					AnimationHandler.play(this.player, `shoot_${this.player.lastDirection}`, true);
				}

			} else {

				AnimationHandler.play(this.player, this.player.lastDirection, true);

				// stand if no cursors are active
				if (this.cursors.up.isUp
					&& this.cursors.down.isUp
					&& this.cursors.left.isUp
					&& this.cursors.right.isUp) {
					this.player.player.setVelocity(0, 0);
					AnimationHandler.play(this.player, `stand_${this.player.lastDirection}`, true);
				}
			}

			/*
			if (this.cursors.up.isDown && this.player.body.touching.down) {
					this.player.setVelocityY(-330);
			}
			*/
		}
	}

	private hitPlayer (player: GameObject, arrow: GameObject) {
		const playerId = player.getData('id');
		const arrowId = arrow.getData('id');
		let playerRef;

		if (playerId === this.player.id) {
			playerRef = this.player;
		} else {
			playerRef = this.otherPlayers.get(playerId);
		}
		// TODO health count on server when hit
		playerRef.health--;
		this.arrows.get(arrowId).destroy();
		if (playerRef.health <= 0) {
			playerRef.player.setVelocity(0, 0);
			// TODO Die event only sent from server when health <= 0
			AnimationHandler.play(this.player, CharacterAnimation.DIE);
		}
	}

	private removeArrow (platform: GameObject, arrow: GameObject) {
		setTimeout(() => {
			this.arrows.get(arrow.getData('id')).destroy();
		}, 300);
	}
}