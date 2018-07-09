import {Character, CharacterAnimation} from '../../shared/models';
import {Scene} from './types';
import {Player} from '../actors/player/player.class';

export class AnimationHandler {
	private static readonly frameRate: number = 20;
	private static characters: Set<Character> = new Set();

	public static readonly shootDuration: number = 400;
	
	public static add(scene: Scene, character: Character): void {

		// add animations for each character only once
		if (this.characters.has(character)) {
			return;
		}
		this.characters.add(character);

		scene.anims.create({
			key: `${character}-${CharacterAnimation.STAND_UP}`,
			frames: [{key: character, frame: 104}],
			frameRate: this.frameRate,
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.UP}`,
			frames: scene.anims.generateFrameNumbers(character, {start: 105, end: 112}),
			frameRate: this.frameRate,
			repeat: -1
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.STAND_DOWN}`,
			frames: [{key: character, frame: 130}],
			frameRate: this.frameRate
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.DOWN}`,
			frames: scene.anims.generateFrameNumbers(character, {start: 131, end: 138}),
			frameRate: this.frameRate,
			repeat: -1
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.STAND_LEFT}`,
			frames: [{key: character, frame: 117}],
			frameRate: this.frameRate
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.LEFT}`,
			frames: scene.anims.generateFrameNumbers(character, {start: 118, end: 125}),
			frameRate: this.frameRate,
			repeat: -1
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.STAND_RIGHT}`,
			frames: [{key: character, frame: 143}],
			frameRate: this.frameRate
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.RIGHT}`,
			frames: scene.anims.generateFrameNumbers(character, {start: 144, end: 151}),
			frameRate: this.frameRate,
			repeat: -1
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.SHOOT_UP}`,
			frames: scene.anims.generateFrameNumbers(character, {start: 209, end: 220}),
			duration: this.shootDuration,
			repeat: 0
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.SHOOT_DOWN}`,
			frames: scene.anims.generateFrameNumbers(character, {start: 235, end: 246}),
			duration: this.shootDuration,
			repeat: 0
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.SHOOT_LEFT}`,
			frames: scene.anims.generateFrameNumbers(character, {start: 222, end: 233}),
			duration: this.shootDuration,
			repeat: 0
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.SHOOT_RIGHT}`,
			frames: scene.anims.generateFrameNumbers(character, {start: 248, end: 259}),
			duration: this.shootDuration,
			repeat: 0
		});

		scene.anims.create({
			key: `${character}-${CharacterAnimation.DIE}`,
			frames: scene.anims.generateFrameNumbers(character, {start: 261, end: 265}),
			duration: this.shootDuration,
			repeat: 0
		});
	}

	public static play(player: Player, animationKey: CharacterAnimation | string, ignoreIfPlaying = false) {
		player.player.anims.play(`${player.character}-${animationKey}`, ignoreIfPlaying);
	}

	public static getCurrent(player: Player): string {
		return player.player.anims.currentAnim.key.split('-')[1];
	}
}