import {LifeCycle} from '../game/lifecycle';
import {Group, GameObject} from '../game/types';
import {Player} from '../actors/player/player.class';
import {
	ArrowData, Character, CharacterAnimation, CoordinatesData, PlayerCoordinates, PlayerData, PlayerHealthData, PlayerHitData,
	PlayerReviveData, SetupData, Team, TeamBase
} from '../../shared/models';
import {AnimationHandler} from '../game/animation.handler';
import {ArrowEvent, GameEvent, PlayerEvent} from '../../shared/events.model';
import {Arrow} from '../props/arrow.class';
import {LayerDepth} from '../game/settings';
import {Hearts} from '../hud/hearts.class';

export class GameScene extends Phaser.Scene implements LifeCycle {

	// game references
	private arrowsGroup: Group;
	private ownArrowsGroup: Group;
	private otherPlayersGroup: Group;

	// model references
	private player: Player;
	private arrows: Map<string, Arrow> = new Map();
	private ownArrows: Map<string, Arrow> = new Map();
	private otherPlayers: Map<string, Player> = new Map();
	private heartsDisplay: Hearts;

	private cursors: CursorKeys;
	private socket: SocketIOClient.Socket;
	private bases: TeamBase[];

	constructor () {
		super({
			key: 'GameScene'
		});

		this.socket = io();
	}

	preload () {
		this.load.image('arrow', 'assets/weapons/arrow.png');
		this.load.spritesheet(Character.DEFAULT,
			'assets/characters/base.png',
			{frameWidth: 64, frameHeight: 64}
		);
		this.load.spritesheet('heart',
			'assets/heart.png',
			{frameWidth: 32, frameHeight: 32});
		this.load.image('tiles', 'assets/tilesets/map_base_extruded.png');
		this.load.tilemapTiledJSON('map', 'assets/tilesets/map.json');
	}

	create () {

		// create map
		const map = this.make.tilemap({key: 'map'});

		// Parameters are the name you gave the tileset in Tiled and then the key of the tileset image in
		// Phaser's cache (i.e. the name you used in preload)
		const tileset = map.addTilesetImage('Terrain', 'tiles', 32, 32, 1, 2);

		// Parameters: layer name (or index) from Tiled, tileset, x, y
		map.createStaticLayer('below_player2', tileset, 0, 0);
		map.createStaticLayer('below_player', tileset, 0, 0);
		const worldLowLayer = map.createStaticLayer('world_low', tileset, 0, 0);
		const worldLayer = map.createStaticLayer('world', tileset, 0, 0);
		const worldHighLayer = map.createStaticLayer('world_high', tileset, 0, 0);
		const aboveLayer = map.createStaticLayer('above_player', tileset, 0, 0);

		worldLowLayer.setCollisionByProperty({collides: true});
		worldLayer.setCollisionByProperty({collides: true});
		aboveLayer.setDepth(LayerDepth.WORLD_ABOVE_PLAYER);
		this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

		// debug
		//*
		const arrowDebugGraphics = this.add.graphics().setAlpha(0.5);
		worldLowLayer.renderDebug(arrowDebugGraphics, {
			tileColor: null, // Color of non-colliding tiles
			collidingTileColor: new Phaser.Display.Color(178, 243, 3, 255), // Color of colliding tiles
			faceColor: new Phaser.Display.Color(67, 221, 100, 255) // Color of colliding face edges
		});
		const debugGraphics = this.add.graphics().setAlpha(0.75);
		worldLayer.renderDebug(debugGraphics, {
			tileColor: null, // Color of non-colliding tiles
			collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
			faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
		});
		//*/

		// create sprite groups
		this.arrowsGroup = this.physics.add.group();
		this.ownArrowsGroup = this.physics.add.group();
		this.otherPlayersGroup = this.physics.add.group();

		// Test with object, area has x, y, width, height
		// const spawnArea = map.findObject('Objects', obj => obj.name === 'Spawn Area');
		this.bases = map.filterObjects('Objects', obj => obj.type === 'base') as any;

		this.bases.forEach(base => {
			const g = this.add.graphics()
				.setAlpha(0.75)
				.fillRect(base.x, base.y, base.width, base.height);
		});

		// add collider for arrows. Only own arrows are tracked, this way
		// the removal of arrows by other players is handled by the server
		this.physics.add.collider(this.ownArrowsGroup, worldLayer, this.onArrowCollision, undefined, this);
		this.physics.add.collider(this.ownArrowsGroup, this.otherPlayersGroup, this.onHitOtherPlayer, undefined, this);

		// PLAYER EVENTS
		// get initial data for own player
		this.socket.on(PlayerEvent.protagonist, (playerData: PlayerData) => {

			// set collision by team of player
			const teamCollider = playerData.team === Team.BLUE ? Team.RED : Team.BLUE;
			worldHighLayer.setCollisionByProperty({team: teamCollider});

			// debug
			const highDebugGraphics = this.add.graphics().setAlpha(0.75);
			worldHighLayer.renderDebug(highDebugGraphics, {
				tileColor: null, // Color of non-colliding tiles
				collidingTileColor: new Phaser.Display.Color(24, 134, 248, 100), // Color of colliding tiles
				faceColor: new Phaser.Display.Color(10, 100, 200, 255) // Color of colliding face edges
			});

			this.player = new Player(this, playerData);
			this.physics.add.collider(this.player.player, worldLayer);
			this.physics.add.collider(this.player.player, worldLowLayer);

			// special colliders according to team color
			this.physics.add.collider(this.player.player, worldHighLayer);
			this.physics.add.collider(this.ownArrowsGroup, worldHighLayer, this.onArrowCollision, undefined, this);
			// this.physics.add.collider(this.player.player, platforms);
			// this.physics.add.collider(this.player.player, this.arrowsGroup, this.onHitOtherPlayer, undefined, this);

			// camera
			//*
			const camera = this.cameras.main;
			camera.startFollow(this.player.player);
			camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
			//*/

			// heart display
			this.heartsDisplay = new Hearts(this, playerData.health);
		});

		// server asks for config
		this.socket.on(GameEvent.setup, () => {
			this.socket.emit(GameEvent.setup, {
				bases: this.bases
			} as SetupData);
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

		// when an other player moves
		this.socket.on(PlayerEvent.coordinates, (data: PlayerCoordinates) => {
			if (this.otherPlayers.has(data.id)) {
				this.otherPlayers.get(data.id).updateMovement(data);
				this.otherPlayers.get(data.id).player.setVelocity(0, 0);
			}
		});

		// a player was hit
		this.socket.on(PlayerEvent.hit, (data: PlayerHealthData) => {
			if (this.player.id === data.id) {
				// own player was hit
				this.player.player.setVelocity(0, 0);
				if (this.player.health === 0) {
					return;
				}
				this.player.health = data.health;
				this.heartsDisplay.update(data.health);
				if (this.player.health <= 0) {
					this.player.animate(CharacterAnimation.DIE);
					this.socket.emit(PlayerEvent.coordinates, {
						id: this.player.id,
						x: this.player.player.x,
						y: this.player.player.y,
						animation: CharacterAnimation.DIE
					} as PlayerCoordinates);

					// set revive countdown
					setTimeout(() => {
						this.socket.emit(PlayerEvent.revive, this.player.id);
					}, 3000);
				} else {
					this.player.blink(this);
				}
			} else {
				// an other player was hit
				if (this.otherPlayers.has(data.id)) {
					this.otherPlayers.get(data.id).player.setVelocity(0, 0);
					this.otherPlayers.get(data.id).health = data.health;
					this.otherPlayers.get(data.id).blink(this);
				}
			}
		});

		// an other player quits
		this.socket.on(PlayerEvent.quit, (playerId: string) => {
			if (this.otherPlayers.has(playerId)) {
				const quitPlayer = this.otherPlayers.get(playerId);
				quitPlayer.destroy();
				this.otherPlayers.delete(playerId);
			}
		});

		// a player is revived
		this.socket.on(PlayerEvent.revive, (data: PlayerReviveData) => {
			if (data.id === this.player.id) {
				this.player.setCoordinates(data.x, data.y);
				this.player.health = data.health;
				this.heartsDisplay.update(data.health);
				this.player.animate(CharacterAnimation.STAND_DOWN);
			} else if (this.otherPlayers.has(data.id)) {
				const player = this.otherPlayers.get(data.id);
				player.setCoordinates(data.x, data.y);
				player.health = data.health;
				player.animate(CharacterAnimation.STAND_DOWN);
			}
		});

		// ARROW EVENTS
		// new arrow was created
		this.socket.on(ArrowEvent.create, (arrowData: ArrowData) => {
			// check if the arrow is created by this player
			if (arrowData.playerId === this.player.id) {
				const arrow = new Arrow(this, arrowData, this.ownArrowsGroup);
				arrow.arrow.setVelocity(arrowData.posDiffX * arrow.baseVelocity, arrowData.posDiffY * arrow.baseVelocity);
				this.ownArrows.set(arrowData.id, arrow);
			} else {
				const arrow = new Arrow(this, arrowData, this.arrowsGroup);
				this.arrows.set(arrowData.id, arrow);
			}
		});

		// arrow coordinates update
		this.socket.on(ArrowEvent.coordinates, (data: CoordinatesData[]) => {
			data.forEach((coors) => {
				if (this.arrows.has(coors.id)) {
					const arrow = this.arrows.get(coors.id);
					arrow.arrow.x = coors.x;
					arrow.arrow.y = coors.y;
				}
			});
		});

		// arrow destroyed
		this.socket.on(ArrowEvent.destroy, (arrowId: string) => {
			if (this.arrows.has(arrowId)) {
				this.arrows.get(arrowId).destroy();
				this.arrows.delete(arrowId);
			} else if (this.ownArrows.has(arrowId)) {
				this.ownArrows.get(arrowId).destroy();
				this.ownArrows.delete(arrowId);
			}
		});

		// request own player from server
		this.socket.emit(GameEvent.authentication,
			{
				name: this.socket.id,
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

			let animation: string = null;

			// send update for arrow positions
			const arrowCoors: CoordinatesData[] = Array.from(this.ownArrows.values()).map((arrow) => {
				return {
					id: arrow.id,
					x: arrow.arrow.x,
					y: arrow.arrow.y
				} as CoordinatesData;
			});
			if (arrowCoors.length > 0) {
				this.socket.emit(ArrowEvent.coordinates, arrowCoors);
			}

			// update hud position
			this.player.updateHudCoordinates();

			// do not react if player is dead
			if (this.player.health === 0) {
				return;
			}

			// trigger start of shoot animation
			if (this.cursors.space.isDown) {
				this.player.isShooting = true;
				animation = `shoot_${this.player.lastDirection}`;
				this.player.player.setVelocity(0, 0);
			}

			// check if shoot animation ended
			if (this.player.player.anims.currentAnim && AnimationHandler.getCurrent(this.player).substr(0, 5) === 'shoot') {
				if (this.player.player.anims.currentFrame.isLast) {
					this.player.isShooting = false;

					// determine arrow direction
					let angle = 0;
					let posDiffX = 0;
					let posDiffY = 0;

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
							break;
						case 'down':
							angle = 270;
							posDiffY = 1;
					}

					const arrowX = this.player.player.x + posDiffX * this.player.player.displayHeight / 2;
					const arrowY = this.player.player.y + posDiffY * this.player.player.displayHeight / 2;

					const arrowData: ArrowData = {
						id: null, // set by server
						playerId: this.player.id,
						team: this.player.team,
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
				if (animation) {
					this.player.animate(animation);
				}
				const coors = {
					id: this.player.id,
					x: this.player.player.x,
					y: this.player.player.y,
					animation
				};
				this.socket.emit(PlayerEvent.coordinates, coors);
				return;
			}

			// TODO use time parameter?
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

			if (this.cursors.space.isDown
				|| now - this.cursors.space.timeDown < 500
				|| now - this.cursors.space.timeUp < 500) {

				// shoot if space is pressed
				this.player.isShooting = true;
				const progress = this.player.player.anims.getProgress();
				if (progress === 1) {
					this.player.isShooting = false;
				}
				if (this.player.isShooting) {
					animation = `shoot_${this.player.lastDirection}`;
				}

			} else {

				animation = this.player.lastDirection;

				// stand if no cursors are active
				if (this.cursors.up.isUp
					&& this.cursors.down.isUp
					&& this.cursors.left.isUp
					&& this.cursors.right.isUp) {
					this.player.player.setVelocity(0, 0);
					animation = `stand_${this.player.lastDirection}`;
				}
			}

			if (animation) {
				this.player.animate(animation);
			}
			const coors = {
				id: this.player.id,
				x: this.player.player.x,
				y: this.player.player.y,
				animation
			};
			this.socket.emit(PlayerEvent.coordinates, coors);

			/*
			if (this.cursors.up.isDown && this.player.body.touching.down) {
					this.player.setVelocityY(-330);
			}
			*/
		}
	}

	private onHitOtherPlayer (arrow: GameObject, player: GameObject) {
		const arrowId = arrow.getData('id');
		const playerId = player.getData('id');

		const hitData: PlayerHitData = {
			playerId,
			arrowId
		};
		this.socket.emit(PlayerEvent.hit, hitData);
	}

	private onArrowCollision (arrow: GameObject, object: GameObject) {
		setTimeout(() => {
			this.socket.emit(ArrowEvent.destroy, arrow.getData('id'));
		}, 300);
	}
}