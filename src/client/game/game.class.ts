import {GameScene} from '../scenes/game.scene';
import {DEBUG} from '../../shared/config';
import {Character} from '../../shared/models';
import {GameEvent, ServerEvent} from '../../shared/events.model';
import {LoginScene} from '../scenes/login';

export class Game {

	private game: Phaser.Game;
	private login: LoginScene;

	constructor () {

		// determine window size / ratio
		const size = this.calculateGameSize();

		const config: GameConfig = {
			type: Phaser.AUTO,
			width: size.width,
			height: size.height,
			'render.pixelArt': true,
			physics: {
				default: 'arcade',
				arcade: {
					gravity: {y: 0},
					debug: DEBUG
				}
			},
			input: {
				activePointers: 2
			},
			scene: [
				GameScene
			]
		};

		this.game = new Phaser.Game(config);

		this.login = new LoginScene(this);

		/*
		window.onresize = () => {
			const size = this.calculateGameSize();
			this.game.resize(size.width, size.height);
		};
		*/
	}

	public authenticate (name: string, character: Character) {
		const scene = this.game.scene.keys['GameScene'];
		if (scene && scene.socket) {
			scene.socket.on(ServerEvent.stop, () => {
				document.querySelector('.gameover-screen').classList.remove('hide');
			});
			scene.socket.emit(GameEvent.authentication, {
				name,
				character
			});
		}

		this.checkGameControls();
	}

	public calculateGameSize (): { width: number, height: number } {
		let w = window,
			d = document,
			e = d.documentElement,
			g = d.getElementsByTagName('body')[0],
			clientWidth = w.innerWidth || e.clientWidth || g.clientWidth,
			clientHeight = w.innerHeight || e.clientHeight || g.clientHeight;
		const max1 = 1080;
		const max2 = 600;
		// add tolerance for UI elements on mobile browsers
		const tolerance = 50;
		let width, height;

		if (clientWidth > clientHeight) {
			width = Math.min(clientWidth - tolerance, max1);
			height = Math.min(clientHeight - tolerance, max2);
		} else {
			width = Math.min(clientWidth - tolerance, max2);
			height = Math.min(clientHeight - tolerance, max1);
		}

		return {
			width,
			height
		};
	}

	public checkGameControls () {
		const urlParams = new URLSearchParams(window.location.search);
		const isAdmin = urlParams.get('admin');
		const scene = this.game.scene.keys['GameScene'];

		if (isAdmin && scene && scene.socket) {

			const controls = document.querySelector('.admin-controls');
			controls.classList.remove('hide');

			const stopButton = document.createElement('button');
			stopButton.innerHTML = 'STOP';
			stopButton.addEventListener('click', () => {
				scene.socket.emit(ServerEvent.stop);
			});
			controls.appendChild(stopButton);

			const resetButton = document.createElement('button');
			resetButton.innerHTML = 'RESET';
			resetButton.addEventListener('click', () => {
				scene.socket.emit(ServerEvent.reset);
			});
			controls.appendChild(resetButton);
		}
	}
}
