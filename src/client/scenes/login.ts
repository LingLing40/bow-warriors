import {GameEvent} from '../../shared/events.model';
import {Game} from '../game/game.class';
import {Character} from '../../shared/models';

declare const window: any;

export class LoginScene {

	private loginScreen: HTMLDivElement;
	private loginLoading: HTMLDivElement;
	private loginForm: HTMLDivElement;
	private loginNameInput: HTMLInputElement;
	private loginCharacters: HTMLDivElement;
	private loginButton: HTMLInputElement;
	private readonly hideClass = 'hide';

	constructor (private game: Game) {
		this.loginScreen = document.querySelector('.login-screen');
		this.loginLoading = document.querySelector('#login-loading');
		this.loginForm = document.querySelector('#login-form');
		this.loginNameInput = document.querySelector('#login-name');
		this.loginButton = document.querySelector('#login-button');
		this.loginCharacters = document.querySelector('#login-characters');

		// create radio inputs for each character
		let html = '';
		let first = true;
		for (let character in Character) {
			html += `<label class="select-character">
					<input type="radio" name="login-character" value="${Character[character]}"${first ? 'checked="checked"' : ''}>
					<div>
						<img src="assets/characters/${Character[character]}_preview.png">
					</div>
			</label>`;

			if (first) {
				first = false;
			}
		}
		this.loginCharacters.innerHTML = html;
		this.loginLoading.classList.toggle(this.hideClass);
		this.loginForm.classList.toggle(this.hideClass);

		this.loginButton.addEventListener('click', this.login.bind(this));
		this.loginNameInput.focus();
	}

	private login () {
		const characterValue = this.loginCharacters.querySelector('input[name="login-character"]:checked') as HTMLInputElement;
		if (characterValue) {
			const character = characterValue.value as Character;
			let name = this.loginNameInput.value;

			if (name.length === 0) {
				name = 'Player ' + Math.ceil(Math.random() * 9999);
			}

			this.game.authenticate(name, character);

			this.toggleLogin();
		}
	}

	private toggleLogin (): void {
		this.loginScreen.classList.toggle(this.hideClass);
	}

}