import 'phaser';
import {Game} from './client/game/game.class';

window.onload = () => {
	new Game();
};

// add touch detection
// https://codeburst.io/the-only-way-to-detect-touch-with-javascript-7791a3346685
window.addEventListener('touchstart', function onFirstTouch() {

	// or set some global variable
	(window as any).USER_IS_TOUCHING = true;

	// we only need to know once that a human touched the screen, so we can stop listening now
	window.removeEventListener('touchstart', onFirstTouch, false);
}, false);