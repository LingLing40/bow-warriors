import {GameScene} from '../scenes/game.scene';
import {DEBUG} from '../../shared/config';
import {Character} from '../../shared/models';
import {GameEvent} from '../../shared/events.model';
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
			scene.socket.emit(GameEvent.authentication, {
				name,
				character
			});
		}
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
		let width, height;

		if (clientWidth > clientHeight) {
			width = Math.min(clientWidth, max1);
			height = Math.min(clientHeight, max2);
		} else {
			width = Math.min(clientWidth, max2);
			height = Math.min(clientHeight, max1);
		}

		return {
			width,
			height
		};
	}
}
