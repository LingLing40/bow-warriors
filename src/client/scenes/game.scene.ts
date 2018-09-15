import {LifeCycle} from '../game/lifecycle';
import {Group, GameObject, ArcadeSprite} from '../game/types';
import {Player} from '../actors/player/player.class';
import {
	ArrowCoordinates,
	ArrowData, Character, CharacterAnimation, CoordinatesData, PlayerCoordinates, PlayerData, PlayerHealthData, PlayerHitData,
	PlayerReviveData, SetupData, Team, TeamBase
} from '../../shared/models';
import {AnimationHandler} from '../game/animation.handler';
import {ArrowEvent, GameEvent, PlayerEvent, ServerEvent} from '../../shared/events.model';
import {Arrow} from '../props/arrow.class';
import {LayerDepth} from '../game/settings';
import {Hearts} from '../hud/hearts.class';
import {DEBUG} from '../../shared/config';
import {VirtualJoyStick} from '../controls/joystick.class';
import {ActionButton} from '../controls/action-button.class';

export class GameScene extends Phaser.Scene implements LifeCycle {

	private socket: SocketIOClient.Socket;

	// game references
	private arrowsGroup: Group;
	private ownArrowsGroup: Group;
	private otherPlayersGroup: Group;
	private otherPlayersHitboxGroup: Group;

	// model references
	private player: Player;
	private arrows: Map<string, Arrow> = new Map();
	private ownArrows: Map<string, Arrow> = new Map();
	private otherPlayers: Map<string, Player> = new Map();
	private heartsDisplay: Hearts;

	// controls
	private cursors: CursorKeys;
	private joyStick: VirtualJoyStick;
	private joyStickCursors: CursorKeys;
	private shootButton: ActionButton;
	private hasTouch: boolean; // if true, touch controls will be used

	// player state, used for comparison to reduce updates
	private playerState: PlayerCoordinates;

	// list of all team bases
	private bases: TeamBase[];

	// text output in debug mode
	private text;

	constructor () {
		super({
			key: 'GameScene'
		});

		this.socket = io();
	}

	preload () {
		this.load.image('transparent', 'assets/transparent.png');
		this.load.image('arrow', 'assets/weapons/arrow.png');
		this.load.image('tiles', 'assets/tilesets/map_base_extruded.png');
		this.load.tilemapTiledJSON('map', 'assets/tilesets/map.json');
		this.load.spritesheet('heart',
			'assets/heart.png',
			{frameWidth: 32, frameHeight: 32});

		// load graphics for characters
		for (let character in Character) {
			this.load.spritesheet(Character[character],
				`assets/characters/${Character[character]}.png`,
				{frameWidth: 64, frameHeight: 64}
			);
		}
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
		if (DEBUG) {
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
		}

		// create sprite groups
		this.arrowsGroup = this.physics.add.group();
		this.ownArrowsGroup = this.physics.add.group();
		this.otherPlayersGroup = this.physics.add.group();
		this.otherPlayersHitboxGroup = this.physics.add.group();

		// Test with object, area has x, y, width, height
		this.bases = map.filterObjects('Objects', obj => obj.type === 'base') as any;

		// debug graphic for bases
		if (DEBUG) {
			this.bases.forEach(base => {
				const g = this.add.graphics()
					.setAlpha(0.75)
					.fillRect(base.x, base.y, base.width, base.height);
			});
		}

		// add collider for arrows. Only own arrows are tracked, this way
		// the removal of arrows by other players is handled by the server
		this.physics.add.collider(this.ownArrowsGroup, worldLayer, this.onArrowCollision, undefined, this);
		this.physics.add.collider(this.ownArrowsGroup, this.otherPlayersGroup, this.onHitOtherPlayer, undefined, this);
		this.physics.add.collider(this.ownArrowsGroup, this.otherPlayersHitboxGroup, this.onHitOtherPlayer, undefined, this);
		this.physics.add.collider(this.arrowsGroup, worldLayer);

		// add colliders for other players
		/*
		this.physics.add.collider(this.otherPlayersGroup, worldLayer);
		this.physics.add.collider(this.otherPlayersGroup, worldLowLayer);
		*/

		// PLAYER EVENTS
		// get initial data for own player
		this.socket.on(PlayerEvent.protagonist, (playerData: PlayerData) => {

			// set collision by team of player
			const teamCollider = playerData.team === Team.BLUE ? Team.RED : Team.BLUE;
			worldHighLayer.setCollisionByProperty({team: teamCollider});

			// debug
			if (DEBUG) {
				const highDebugGraphics = this.add.graphics().setAlpha(0.75);
				worldHighLayer.renderDebug(highDebugGraphics, {
					tileColor: null, // Color of non-colliding tiles
					collidingTileColor: new Phaser.Display.Color(24, 134, 248, 100), // Color of colliding tiles
					faceColor: new Phaser.Display.Color(10, 100, 200, 255) // Color of colliding face edges
				});
			}

			this.player = new Player(this, playerData);
			this.playerState = playerData;
			this.physics.add.collider(this.player.player, worldLayer);
			this.physics.add.collider(this.player.player, worldLowLayer);

			// special colliders according to team color
			this.physics.add.collider(this.player.player, worldHighLayer);
			this.physics.add.collider(this.ownArrowsGroup, worldHighLayer, this.onArrowCollision, undefined, this);

			// camera
			const camera = this.cameras.main;
			camera.startFollow(this.player.player);
			camera.setBounds(0, 0, map.widthInPixels, map.heightInPixels);

			// heart display
			this.heartsDisplay = new Hearts(this, playerData.health);
		});

		// server asks for config
		this.socket.on(GameEvent.setup, () => {
			this.socket.emit(GameEvent.setup, {
				bases: this.bases
			} as SetupData);
		});

		// own client was detected as disconnected
		this.socket.on(ServerEvent.reconnect, () => {
			alert('You have been disconnected from the game. You need to reload to join back into the game.');
			location.reload();
		});

		// get initial list of players
		this.socket.on(PlayerEvent.players, (players: PlayerData[]) => {
			players.forEach(playerData => {
				const otherPlayer = new Player(this, playerData, this.otherPlayersGroup, this.otherPlayersHitboxGroup);
				this.otherPlayers.set(playerData.id, otherPlayer);
			})
		});

		// when a new player joins during the game
		this.socket.on(PlayerEvent.joined, (playerData: PlayerData) => {
			const joinedPlayer = new Player(this, playerData, this.otherPlayersGroup, this.otherPlayersHitboxGroup);
			this.otherPlayers.set(playerData.id, joinedPlayer);
		});

		// when an other player moves
		this.socket.on(PlayerEvent.coordinates, (data: PlayerCoordinates) => {
			if (this.otherPlayers.has(data.id)) {
				this.otherPlayers.get(data.id).updateMovement(data);
				// this.otherPlayers.get(data.id).player.setVelocity(0, 0);
			}
		});

		// a player was hit
		this.socket.on(PlayerEvent.hit, (data: PlayerHealthData) => {
			if (this.player.id === data.id) {
				// own player was hit
				this.player.setVelocity(0, 0);
				if (this.player.health === 0) {
					return;
				}
				this.player.health = data.health;
				this.heartsDisplay.update(data.health);
				if (this.player.health <= 0) {
					this.player.animate(CharacterAnimation.DIE);
					const playerData: PlayerCoordinates = {
						id: this.player.id,
						x: this.player.player.x,
						y: this.player.player.y,
						velocityX: 0,
						velocityY: 0,
						animation: CharacterAnimation.DIE
					};
					if (this.didPlayerMove(playerData)) {
						this.socket.emit(PlayerEvent.coordinates, playerData);
					}

					// set revive countdown
					this.time.delayedCall(3000, () => {
						this.socket.emit(PlayerEvent.revive, this.player.id);
					}, [], this);
				} else {
					this.player.blink(this);
				}
			} else {
				// an other player was hit
				if (this.otherPlayers.has(data.id)) {
					this.otherPlayers.get(data.id).setVelocity(0, 0);
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
			let arrow: Arrow;
			// check if the arrow is created by this player
			if (arrowData.playerId === this.player.id) {
				arrow = new Arrow(this, arrowData, this.ownArrowsGroup);
				this.ownArrows.set(arrowData.id, arrow);
			} else {
				arrow = new Arrow(this, arrowData, this.arrowsGroup);
				this.arrows.set(arrowData.id, arrow);
			}
			arrow.arrow.setVelocity(arrowData.posDiffX * Arrow.baseVelocity, arrowData.posDiffY * Arrow.baseVelocity);
		});

		// arrow coordinates update
		/*
		this.socket.on(ArrowEvent.coordinates, (data: ArrowData[]) => {
			data.forEach((coors) => {
				if (this.arrows.has(coors.id)) {
					const arrow = this.arrows.get(coors.id);
					arrow.arrow.x = coors.x;
					arrow.arrow.y = coors.y;
					if (coors.velocityX) {
						arrow.arrow.setVelocity(coors.velocityX, coors.velocityY);
					}
				}
			});
		});
		*/

		// get initial list of other arrows
		this.socket.on(ArrowEvent.arrows, (data: ArrowData[]) => {
			data.forEach((entry) => {
				const arrow = new Arrow(this, entry, this.arrowsGroup);
				arrow.arrow.setVelocity(entry.posDiffX * Arrow.baseVelocity, entry.posDiffY * Arrow.baseVelocity);
				this.arrows.set(entry.id, arrow);
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

		if (DEBUG) {
			this.text = this.add.text(0, 0, '');
			this.text.setScrollFactor(0)
				.setDepth(1000);
		}

		// shoot button
		const shootButtonX = this.sys.game.config.width as integer - ActionButton.buttonSize - 30;
		const shootButtonY = this.sys.game.config.height as integer - ActionButton.buttonSize - 30;
		this.shootButton = new ActionButton(this, shootButtonX, shootButtonY, 'SHOOT');
		this.shootButton.setEnable(false);
		// add additional pointer for actionButton
		this.input.addPointer(1);

		// joystick control
		this.joyStick = new VirtualJoyStick(this, {
			x: 100,
			y: this.sys.game.config.height as integer - 100,
			radius: 70,
			// base: 'joystick_bg',
			// thumb: 'joystick_pin',
			depth: LayerDepth.JOYSTICK,
			// base: this.add.graphics().fillStyle(0x888888).fillCircle(0, 0, 100),
			// thumb: this.add.graphics().fillStyle(0xcccccc).fillCircle(0, 0, 50),
			// dir: '8dir',   // 'up&down'|0|'left&right'|1|'4dir'|2|'8dir'|3
			// forceMin: 16,
			enable: false
		});
		this.joyStick.setVisible(false);
		// this.joyStick.touchCursor.events.on('update', this.dumpJoyStickState, this);
		// this.dumpJoyStickState();

		this.cursors = this.input.keyboard.createCursorKeys();
		this.joyStickCursors = this.joyStick.createCursorKeys();

		// add touch detection
		// https://codeburst.io/the-only-way-to-detect-touch-with-javascript-7791a3346685
		window.addEventListener('touchstart', function onFirstTouch () {

			this.joyStick.setEnable(true);
			this.joyStick.setVisible(true);
			this.shootButton.setEnable(true);
			this.hasTouch = true;

			// we only need to know once that a human touched the screen, so we can stop listening now
			window.removeEventListener('touchstart', onFirstTouch, false);
		}.bind(this), false);
	}

	update (time: number, delta: number) {

		if (this.player
			&& this.cursors
			&& this.joyStickCursors
			&& this.cursors.space
			&& this.cursors.up
			&& this.cursors.down
			&& this.cursors.left
			&& this.cursors.right) {

			if (DEBUG) {
				this.text.setText('');
				this.logPointers();
			}

			// abstract cursors for equal handling of joystick and keyboard
			let input = this.cursors;
			if (this.hasTouch) {
				input = this.joyStickCursors;
				input.space = this.shootButton.key;
			}

			let animation: string = null;

			// send update for arrow positions
			/*
			const currentOwnArrows: Arrow[] = Array.from(this.ownArrows.values());
			if (currentOwnArrows.length !== 0) {
				const arrowCoors: CoordinatesData[] = currentOwnArrows.map((arrow) => {
					return {
						id: arrow.id,
						x: arrow.arrow.x,
						y: arrow.arrow.y
					};
				});
				this.socket.emit(ArrowEvent.coordinates, arrowCoors);
			}
			*/

			// update hud/hitbox/shadow position
			this.player.updateOtherCoordinates();

			// do not react if player is dead
			if (this.player.health === 0) {
				return;
			}

			// trigger start of shoot animation
			if (input.space.isDown) {
				this.player.isShooting = true;
				animation = `shoot_${this.player.lastDirection}`;
				this.player.player.setVelocity(0, 0);
			}

			// check if shoot animation ended
			if (this.player.player.anims.currentAnim && AnimationHandler.getCurrent(this.player).substr(0, 5) === 'shoot') {
				if (this.player.player.anims.currentFrame.isLast) {
					this.player.isShooting = false;
					this.player.player.anims.setProgress(0);

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

					const arrowX = this.player.player.x;
					const arrowY = this.player.player.y;

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
				const coors: PlayerCoordinates = {
					id: this.player.id,
					x: this.player.player.x,
					y: this.player.player.y,
					velocityX: this.player.player.body.velocity.x,
					velocityY: this.player.player.body.velocity.y,
					animation: animation as CharacterAnimation
				};
				if (this.didPlayerMove(coors)) {
					this.socket.emit(PlayerEvent.coordinates, coors);
				}
				return;
			}

			const now = Date.now();
			const tolerance = 1000;

			if (input.up.isDown) {
				this.player.lastDirection = 'up';
				this.player.player.setVelocityY(-1 * this.player.baseVelocity);
			} else if (input.down.isDown) {
				this.player.lastDirection = 'down';
				this.player.player.setVelocityY(this.player.baseVelocity);
			} else if (now - input.down.timeUp > tolerance
				&& now - input.down.timeUp > tolerance) {
				this.player.player.setVelocityY(0);
			}

			if (input.left.isDown) {
				this.player.lastDirection = 'left';
				this.player.player.setVelocityX(-1 * this.player.baseVelocity);
			} else if (input.right.isDown) {
				this.player.lastDirection = 'right';
				this.player.player.setVelocityX(this.player.baseVelocity);
			} else if (now - input.left.timeUp > tolerance
				&& now - input.right.timeUp > tolerance) {
				this.player.player.setVelocityX(0);
			}

			// Normalize and scale the velocity so that player can't move faster along a diagonal
			this.player.player.body.velocity.normalize().scale(this.player.baseVelocity);

			if (input.space.isDown
			/*|| now - input.space.timeDown < AnimationHandler.shootDuration
			|| now - input.space.timeUp < AnimationHandler.shootDuration */) {

				// shoot if space is pressed
				this.player.isShooting = true;
				const currentFrame = this.player.player.anims.currentFrame;
				if (currentFrame && currentFrame.isLast) {
					this.player.isShooting = false;
				}
				if (this.player.isShooting) {
					animation = `shoot_${this.player.lastDirection}`;
				}

			} else {

				animation = this.player.lastDirection;

				// stand if no cursors are active
				if (input.up.isUp
					&& input.down.isUp
					&& input.left.isUp
					&& input.right.isUp) {
					this.player.player.setVelocity(0, 0);
					animation = `stand_${this.player.lastDirection}`;
				}
			}

			if (animation) {
				this.player.animate(animation);
			}
			const coors: PlayerCoordinates = {
				id: this.player.id,
				x: this.player.player.x,
				y: this.player.player.y,
				velocityX: this.player.player.body.velocity.x,
				velocityY: this.player.player.body.velocity.y,
				animation: animation as CharacterAnimation
			};
			if (this.didPlayerMove(coors)) {
				this.socket.emit(PlayerEvent.coordinates, coors);
			}

			// finally, update other player's coordinates
			const otherPlayers = this.otherPlayers.values();
			let otherPlayer = otherPlayers.next();
			while(!otherPlayer.done) {
				otherPlayer.value.updateOtherCoordinates();
				otherPlayer = otherPlayers.next();
			}
		}
	}

	private onHitOtherPlayer (arrow: ArcadeSprite, player: GameObject) {
		const arrowId = arrow.getData('id');
		const playerId = player.getData('id');

		const hitData: PlayerHitData = {
			playerId,
			arrowId
		};
		/*
		const arrowCoors: ArrowCoordinates = {
			id: arrowId,
			x: arrow.x,
			y: arrow.y,
			velocityX: arrow.body.velocity.x,
			velocityY: arrow.body.velocity.y
		};
		*/
		this.socket.emit(PlayerEvent.hit, hitData);
		// this.socket.emit(ArrowEvent.coordinates, arrowCoors);
	}

	private onArrowCollision (arrow: ArcadeSprite, object: GameObject) {
		/*
		const arrowCoors: ArrowCoordinates = {
			id: arrow.getData('id'),
			x: arrow.x,
			y: arrow.y,
			velocityX: arrow.body.velocity.x,
			velocityY: arrow.body.velocity.y
		};
		this.socket.emit(ArrowEvent.coordinates, arrowCoors);
		*/
		this.time.delayedCall(300, () => {
			this.socket.emit(ArrowEvent.destroy, arrow.getData('id'));
		}, [], this);
	}

	private didPlayerMove (newState: PlayerCoordinates | PlayerData): boolean {
		let didMove: boolean = false;

		// check single property changes
		if (this.playerState.velocityX !== newState.velocityX) {
			didMove = true;
		} else if (this.playerState.velocityY !== newState.velocityY) {
			didMove = true;
		} else if (this.playerState.animation !== newState.animation) {
			didMove = true;
		}

		// check multiple property changes
		// if colliding, the velocity may stay equal, but x/y do not change anymore
		if (this.playerState.velocityX === newState.velocityX
			&& this.playerState.velocityY === newState.velocityY) {

			if (newState.velocityX !== 0 && newState.velocityY !== 0) {
				// diagonal collision
				if (this.playerState.x === newState.x || this.playerState.y === newState.y) {
					didMove = true;
				} else {
					this.playerState = newState;
				}
			} else {
				if (newState.velocityX === 0 && newState.velocityY === 0) {
					// do nothing if not moving
				} else if (this.playerState.x === newState.x && this.playerState.y === newState.y) {
					// frontal collision
					didMove = true;
				} else {
					this.playerState = newState;
				}
			}
		}

		if (didMove) {
			this.playerState = newState;
		}

		return didMove;
	}

	//
	// DEBUG HELPERS
	//

	private logPointers () {
		let s = '\nPointers:';
		s += '\n Pointer1: active=' + this.input.pointer1.active;
		s += '\n Pointer2: active=' + this.input.pointer2.active;

		this.text.setText(this.text.text + s);
	}

	private dumpJoyStickState () {
		if (!this.joyStick) {
			return;
		}
		const cursorKeys = this.joyStick.createCursorKeys();
		let s = '\nKey down: ';
		for (let name in cursorKeys) {
			if (cursorKeys[name].isDown) {
				s += name + ' ';
			}
		}
		s += '\n';
		s += ('Force: ' + Math.floor(this.joyStick.force * 100) / 100 + '\n');
		s += ('Angle: ' + Math.floor(this.joyStick.angle * 100) / 100 + '\n');
		this.text.setText(this.text.text + s);
	}
}