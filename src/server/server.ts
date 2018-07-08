import {
	ArrowEvent,
	// CometEvent,
	GameEvent,
	PlayerEvent,
	ServerEvent
} from './../shared/events.model';
import {
	AllArrowData,
	AllPlayerData,
	ArrowData,
	AuthenticationData,
	CharacterAnimation, CoordinatesData, PlayerCoordinates,
	PlayerData, PlayerHealthData, PlayerHitData
} from '../shared/models';

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

	// private gameHasStarted: boolean = false;
	private players: AllPlayerData = {};
	private arrows: AllArrowData = {};

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
			console.info('connected');
			this.attachListeners(socket);

			socket.on('arrow', (id) => {
				console.info('arrow fired', id);
			});
		});
	}

	private attachListeners (socket): void {
		this.addSignOnListener(socket);
		this.addMovementListener(socket);
		this.addSignOutListener(socket);
		this.addArrowListeners(socket);
		this.addHitListener(socket);
		// this.addCometHitListener(socket);
		// this.addPickupListener(socket);
	}

	private addArrowListeners (socket): void {
		socket.on(ArrowEvent.shoot, (arrowData: ArrowData) => {
			arrowData.id = uuid();
			this.arrows[arrowData.id] = arrowData;
			socket.emit(ArrowEvent.create, arrowData);
			socket.broadcast.emit(ArrowEvent.create, arrowData);
		});

		socket.on(ArrowEvent.coordinates, (data: CoordinatesData[]) => {
			const update: CoordinatesData[] = [];
			data.forEach((coors: CoordinatesData) => {
				if (this.arrows[coors.id]) {
					this.arrows[coors.id].x = coors.x;
					this.arrows[coors.id].y = coors.y;
					update.push(coors);
				}
			});
			socket.broadcast.emit(ArrowEvent.coordinates, update);
		});

		socket.on(ArrowEvent.destroy, (id: string) => {
			if (this.arrows[id]) {
				socket.emit(ArrowEvent.destroy, id);
				socket.broadcast.emit(ArrowEvent.destroy, id);
				delete this.arrows[id];
			}
		});
	}

	private addHitListener(socket): void {
			socket.on(PlayerEvent.hit, (data: PlayerHitData) => {
				const player = this.players[data.playerId];
				if (player) {
					player.health--;
					if (player.health < 0) {
						player.health = 0;
					}
					if (this.arrows[data.arrowId]) {
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

	/*
	private updateComet(socket) {
			if (this.hasComet) {
					let asteroidCoordinates = this.generateRandomCoordinates();
					asteroidCoordinates.y = -128;
					const update = setInterval(() => {
							asteroidCoordinates.y += 1;
							asteroidCoordinates.x -= 1;
							socket.emit(CometEvent.coordinates, asteroidCoordinates);
							socket.broadcast.emit(CometEvent.coordinates, asteroidCoordinates);
							this.destroyComet(asteroidCoordinates, socket, update)
					}, 25);
			}
	}

	private destroyComet(asteroidCoordinates, socket, update): void {
			if (asteroidCoordinates.x < -128) {
					socket.emit(CometEvent.destroy);
					socket.broadcast.emit(CometEvent.destroy);
					this.hasComet = false;
					global.clearInterval(update);
			}
	}

	private addCometHitListener(socket): void {
			socket.on(CometEvent.hit, (playerId) => {
					socket.broadcast.emit(CometEvent.hit, playerId);
			});
	}

	private gameInitialised(socket): void {
			if (!this.gameHasStarted) {
					this.gameHasStarted = true;
					this.createComet(socket, 1000);
					this.calcPickupCoordinates(socket, 5000);
			}
	}

	private calcPickupCoordinates(socket, interval: number) {
			setInterval(() => {
					const coordinates = this.generateRandomCoordinates();
					socket.emit(GameEvent.drop, coordinates);
					socket.broadcast.emit(GameEvent.drop, coordinates);
			}, interval);
	}

	private createComet(socket, interval: number) {
			setInterval(() => {
					if (!this.hasComet) {
							socket.comet = {
									id: uuid()
							};
							this.hasComet = true;
							socket.emit(CometEvent.create, socket.comet);
							socket.broadcast.emit(CometEvent.create, socket.comet);
							this.updateComet(socket);
					}
			}, interval);
	}

	private addPickupListener(socket): void {
			socket.on(PlayerEvent.pickup, (player) => {
					socket.player.ammo = player.ammo;
					socket.broadcast.emit(PlayerEvent.pickup, player.uuid);
			});
	}
	*/

	private addMovementListener (socket): void {
		socket.on(PlayerEvent.coordinates, (data: PlayerCoordinates) => {
			const player = this.players[data.id];
			if (player) {
				player.x = data.x;
				player.y = data.y;
				player.animation = data.animation;
				socket.broadcast.emit(PlayerEvent.coordinates, data);
			}
		});
	}

	private addSignOutListener (socket): void {
		socket.on(ServerEvent.disconnected, () => {
			if (this.players[socket.id]) {
				socket.broadcast.emit(PlayerEvent.quit, socket.id);
				delete this.players[socket.id];
			}
		});
	}

	private addSignOnListener (socket): void {
		socket.on(GameEvent.authentication, (options: AuthenticationData) => {
			socket.emit(PlayerEvent.players, this.getAllPlayers());
			this.createPlayer(socket, options);
			socket.emit(PlayerEvent.protagonist, this.players[socket.id]);
			socket.broadcast.emit(PlayerEvent.joined, this.players[socket.id]);
			// this.gameInitialised(socket);
		});
	}

	private createPlayer (socket, options: AuthenticationData): void {
		const coords = this.generateRandomCoordinates();
		this.players[socket.id] = {
			id: socket.id,
			name: options.name,
			character: options.character,
			x: coords.x,
			y: coords.y,
			animation: CharacterAnimation.STAND_DOWN,
			health: 3
		};
	}

	/*
	private get players(): number {
			return Object.keys(io.sockets.connected).length;
	}
	*/

	private getAllPlayers (): PlayerData[] {
		return Object.keys(this.players).map((id) => {
			return this.players[id];
		});
	}

	private generateRandomCoordinates (): { x: number, y: number } {
		return {
			x: Math.floor(Math.random() * 800) + 1,
			y: Math.floor(Math.random() * 600) + 1
		};
	}

	/*
	private randomInt (low, high): number {
		return Math.floor(Math.random() * (high - low) + low);
	}
	*/
}

const gameSession = new GameServer();

gameSession.connect(3000);
