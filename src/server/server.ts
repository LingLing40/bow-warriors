import {
	ArrowEvent,
	GameEvent,
	PlayerEvent,
	ServerEvent
} from './../shared/events.model';
import {
	AllArrowData,
	AllPlayerData,
	ArrowData,
	AuthenticationData,
	CharacterAnimation, PlayerCoordinates,
	PlayerData, PlayerHealthData, PlayerHitData, PlayerReviveData, PointsData, SetupData, Team, TeamBase
} from '../shared/models';
import {Arrow} from '../client/props/arrow.class';
import {BASE_HEALTH, POINTS_BONUS_DEADLY_HIT, POINTS_FRIENDLY_HIT, POINTS_HIT} from '../shared/config';

const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const uuid = require('uuid');

app.use(express.static('public'));

app.get('/', (req, res) => {
	res.sendfile(`./index.html`);
});

class GameServer {

	private players: AllPlayerData = {};
	private arrows: AllArrowData = {};
	private bases: TeamBase[];
	private points: PointsData = {};
	private isGameRunning: boolean = true;

	constructor () {
		this.socketEvents();
	}

	public connect (port): void {
		http.listen(port, () => {
			console.info(`Listening on port ${port}`);
		});
	}

	private socketEvents (): void {
		io.on(ServerEvent.connected, socket => {
			console.info('New client connected:', socket.id);
			if (this.isGameRunning) {
				this.attachListeners(socket);
			}
			this.addGameListener(socket);
		});
	}

	private attachListeners (socket): void {
		this.addSignOnListener(socket);
		this.addMovementListener(socket);
		this.addSignOutListener(socket);
		this.addArrowListeners(socket);
		this.addHitListener(socket);
	}

	private addArrowListeners (socket): void {
		socket.on(ArrowEvent.shoot, (arrowData: ArrowData) => {
			if (this.players[arrowData.playerId]) {
				arrowData.created = Date.now();
				arrowData.id = uuid();
				this.arrows[arrowData.id] = arrowData;
				socket.emit(ArrowEvent.create, arrowData);
				socket.broadcast.emit(ArrowEvent.create, arrowData);
				this.players[arrowData.playerId].statisticArrows++;
			} else {
				this.reconnectPlayer(socket);
			}
		});

		/*
		socket.on(ArrowEvent.coordinates, (data: ArrowCoordinates[]) => {
			// const update: ArrowCoordinates[] = [];
			data.forEach((coors) => {
				if (this.arrows[coors.id]) {
					this.arrows[coors.id].x = coors.x;
					this.arrows[coors.id].y = coors.y;
					// update.push(coors);
				}
			});
			// socket.broadcast.emit(ArrowEvent.coordinates, update);
		});
		*/

		socket.on(ArrowEvent.destroy, (id: string) => {
			if (this.arrows[id]) {
				socket.emit(ArrowEvent.destroy, id);
				socket.broadcast.emit(ArrowEvent.destroy, id);
				delete this.arrows[id];
			}
		});
	}

	private addHitListener (socket): void {
		socket.on(PlayerEvent.hit, (data: PlayerHitData) => {
			const player = this.players[data.playerId];
			const arrow = this.arrows[data.arrowId];
			const shootingPlayer = arrow ? this.players[arrow.playerId] : null;

			if (player) {
				player.statisticSelfHit++;
				player.health--;

				if (player.health === 0) {
					player.statisticDied++;
					if (shootingPlayer) {
						shootingPlayer.statisticOtherDeadlyHit++;
						this.points[shootingPlayer.team] += POINTS_BONUS_DEADLY_HIT;
					}
				}

				if (player.health < 0) {
					player.health = 0;
				}

				if (arrow) {
					if (shootingPlayer) {
						shootingPlayer.statisticOtherTotalHit++;

						// detect friendly fire
						if (player.team === shootingPlayer.team) {
							shootingPlayer.statisticFriendlyFire++;
							this.points[shootingPlayer.team] -= POINTS_FRIENDLY_HIT;
						} else {
							this.points[shootingPlayer.team] += POINTS_HIT;
						}
						this.updatePoints(socket);
					}
					socket.emit(ArrowEvent.destroy, data.arrowId);
					socket.broadcast.emit(ArrowEvent.destroy, data.arrowId);
					delete this.arrows[data.arrowId];
				}

				const playerHealthData: PlayerHealthData = {
					id: player.id,
					health: player.health
				};
				socket.emit(PlayerEvent.hit, playerHealthData);
				socket.broadcast.emit(PlayerEvent.hit, playerHealthData);
			}
		});
	}

	private addMovementListener (socket): void {
		socket.on(PlayerEvent.coordinates, (data: PlayerCoordinates) => {
			const player = this.players[data.id];
			if (player) {
				player.x = data.x;
				player.y = data.y;
				player.velocityX = data.velocityX;
				player.velocityY = data.velocityY;
				player.animation = data.animation;
				socket.broadcast.emit(PlayerEvent.coordinates, data);
			}
		});
	}

	private addSignOutListener (socket): void {
		socket.on(ServerEvent.disconnected, () => {
			console.info('Client disconnected:', socket.id);
			if (this.players[socket.id]) {
				socket.broadcast.emit(PlayerEvent.quit, socket.id);
				delete this.players[socket.id];
			}
		});
	}

	private stopGame (socket) {
		socket.broadcast.emit(ServerEvent.stop);
		socket.disconnect();
		this.isGameRunning = false;
	}

	private addGameListener (socket): void {
		socket.on(ServerEvent.reset, () => {
			console.info('Game is resetted.')
			this.stopGame(socket);
			this.players = {};
			this.arrows = {};
			this.bases = null;
			this.points = {};
			this.isGameRunning = true;
		});

		socket.on(ServerEvent.stop, () => {
			console.info('Game was stopped.')
			this.stopGame(socket);
		});
	}

	private addSignOnListener (socket): void {
		socket.on(GameEvent.authentication, (options: AuthenticationData) => {
			if (!this.isGameRunning) {
				socket.emit(ServerEvent.stop);
				return;
			}
			// make sure data for bases is available
			if (!this.bases) {
				socket.on(GameEvent.setup, (data: SetupData) => {
					this.bases = data.bases;

					// setup team points
					Object.keys(Team).forEach(team => {
						this.points[Team[team]] = 0;
					});

					this.afterSignOnSetup(socket, options);
				});

				socket.emit(GameEvent.setup);
			} else {
				this.afterSignOnSetup(socket, options);
			}
		});

		socket.on(PlayerEvent.revive, (id: string) => {
			const player = this.players[id];
			if (player) {
				const coors = this.getCoordinateInTeamBase(player.team);
				player.x = coors.x;
				player.y = coors.y;
				player.health = BASE_HEALTH;
				const data: PlayerReviveData = {
					id,
					x: player.x,
					y: player.y,
					health: player.health
				};
				socket.emit(PlayerEvent.revive, data);
				socket.broadcast.emit(PlayerEvent.revive, data);
			}
		});
	}

	private afterSignOnSetup (socket, options: AuthenticationData): void {
		socket.emit(PlayerEvent.players, this.getAllPlayers());
		this.createPlayer(socket, options);
		socket.emit(PlayerEvent.protagonist, this.players[socket.id]);
		socket.broadcast.emit(PlayerEvent.joined, this.players[socket.id]);
		const arrows = this.getAllArrows();
		socket.emit(ArrowEvent.arrows, arrows);
		this.updatePoints(socket);
	}

	private createPlayer (socket, options: AuthenticationData): void {

		// count team members to determine team color
		let count = {};
		count[Team.RED] = 0;
		count[Team.BLUE] = 0;
		for (let id in this.players) {
			count[this.players[id].team]++;
		}
		const team = count[Team.RED] > count[Team.BLUE] ? Team.BLUE : Team.RED;

		const coords = this.getCoordinateInTeamBase(team);
		this.players[socket.id] = {
			id: socket.id,
			name: options.name,
			character: options.character,
			team,
			x: coords.x,
			y: coords.y,
			velocityX: 0,
			velocityY: 0,
			animation: CharacterAnimation.STAND_DOWN,
			health: BASE_HEALTH,
			statisticArrows: 0,
			statisticDied: 0,
			statisticSelfHit: 0,
			statisticFriendlyFire: 0,
			statisticOtherTotalHit: 0,
			statisticOtherDeadlyHit: 0
		};
	}

	private reconnectPlayer (socket) {
		socket.emit(ServerEvent.reconnect);
	}

	private getAllPlayers (): PlayerData[] {
		return Object.keys(this.players).map((id) => {
			return this.players[id];
		});
	}

	/**
	 * @returns {ArrowData[]} Arrows with current position relative to creation time
	 */
	private getAllArrows (): ArrowData[] {
		return Object.keys(this.arrows).map((id) => {
			const arrow = Object.assign({}, this.arrows[id]);
			const timeDiff = Date.now() - arrow.created / 1000;
			arrow.x = arrow.x + (arrow.posDiffX * Arrow.baseVelocity * timeDiff);
			arrow.y = arrow.y + (arrow.posDiffY * Arrow.baseVelocity * timeDiff);
			return arrow;
		});
	}

	private updatePoints (socket): void {
		socket.emit(GameEvent.points, this.points);
		socket.broadcast.emit(GameEvent.points, this.points);
	}

	private getCoordinateInTeamBase (team: Team): { x: number, y: number } {

		const base = this.bases.find(base => base.properties.team === team);

		// limit area so that the sprite is rendered within base
		// (sprites are center-positioned in game)
		const limitX = 20;
		const limitY = 32;
		const x = base.x + limitX;
		const y = base.y;
		const width = base.width - 2 * limitX;
		const height = base.height - limitY;

		if (base) {
			const diffX = Math.random() * width;
			const diffY = Math.random() * height;
			return {
				x: x + diffX,
				y: y + diffY
			};
		} else {
			return this.generateRandomCoordinates();
		}
	}

	private generateRandomCoordinates (): { x: number, y: number } {
		return {
			x: Math.floor(Math.random() * 800) + 1,
			y: Math.floor(Math.random() * 600) + 1
		};
	}
}

const gameSession = new GameServer();

const port = process.env.PORT || 3000;
gameSession.connect(port);
