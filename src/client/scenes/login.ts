import {GameEvent} from '../../shared/events.model';
import {Game} from '../game/game.class';
import {Character} from '../../shared/models';

declare const window: any;

export class LoginScene {

	private loginScreen: HTMLDivElement;
	private loginNameInput: HTMLInputElement;
	private loginCharacters: HTMLDivElement;
	private loginButton: HTMLInputElement;

	/*
	public formContainer: HTMLDivElement;
	public loginPage: HTMLDivElement;
	public form: HTMLDivElement;
	public loginForm: HTMLFormElement;
	public input: HTMLInputElement;
	public button: HTMLButtonElement;
	private name: any;
	*/

	constructor (private game: Game) {
		this.loginScreen = document.querySelector('.login-screen');
		this.loginNameInput = document.querySelector('#login-name');
		this.loginButton = document.querySelector('#login-button');
		this.loginCharacters = document.querySelector('#login-characters');

		// create radio inputs for each character
		let html = '';
		let first = true;
		for (let character in Character) {
			html += `<label>
					<input type="radio" name="login-character" value="${Character[character]}"${first ? 'checked="checked"' : ''}>
					${Character[character]}
			</label>`;

			if (first) {
				first = false;
			}
		}
		this.loginCharacters.innerHTML = html;

		this.loginButton.addEventListener('click', this.login.bind(this));
		this.loginNameInput.focus();
		// this.createForm()
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

	/*
	private createForm () {
		this.formContainer = document.createElement('div');
		this.formContainer.className = 'form-container';

		this.loginPage = document.createElement('div');
		this.loginPage.className = 'login-page';

		this.form = document.createElement('div');
		this.form.className = 'form';

		this.loginForm = document.createElement('form');

		this.input = document.createElement('input');
		this.input.setAttribute('type', 'text');
		this.input.placeholder = 'username';
		this.input.id = 'your-name';
		this.input.focus();

		this.button = document.createElement('button');
		this.button.innerText = 'Join game';
		this.button.addEventListener('click', (e) => this.createPlayer(e));

		this.loginForm.appendChild(this.input);
		this.loginForm.appendChild(this.button);
		this.loginPage.appendChild(this.form);
		this.form.appendChild(this.loginForm);
		this.formContainer.appendChild(this.loginPage);

		document.body.appendChild(this.formContainer);
	}

	private createPlayer (e): void {
		e.preventDefault();
		this.toggleLogin();
		const name = this.input.value;
		window.socket.emit(GameEvent.authentication, {name}, {
			x: window.innerWidth,
			y: window.innerHeight
		});
	}
	*/

	private toggleLogin (): void {
		this.loginScreen.classList.toggle('hide');
	}

}