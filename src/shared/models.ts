export enum Character {
	DEFAULT = 'dude'
}

export enum CharacterAnimation {
	STAND_UP = 'stand_up',
	STAND_DOWN = 'stand_down',
	STAND_LEFT = 'stand_left',
	STAND_RIGHT = 'stand_right',
	UP = 'up',
	DOWN = 'down',
	LEFT = 'left',
	RIGHT = 'right',
	SHOOT_UP = 'shoot_up',
	SHOOT_DOWN = 'shoot_down',
	SHOOT_LEFT = 'shoot_left',
	SHOOT_RIGHT = 'shoot_right',
	DIE = 'die'
}

/**
 * PlayerData stored on server and on clients
 */
export interface PlayerData {
	id: string;
	name: string;
	character: Character;
	x: number;
	y: number;
	// velocityX: number;
	// velocityY: number;
	animation: CharacterAnimation;
	health: number;
}

/**
 * List of all Players on server
 */
export interface AllPlayerData {
	[key: string]: PlayerData;
}

/**
 * Initial connection of a new player
 */
export interface AuthenticationData {
	name: string;
	character: Character;
}

/**
 * Initial creation of new arrow
 */
export interface ArrowData {
	id: string;
	playerId: string;
	x: number;
	y: number;
	posDiffX: number;
	posDiffY: number;
	angle: number;
}

/**
 * List of all arrows on server
 */
export interface AllArrowData {
	[key: string]: ArrowData;
}

/**
 * 
 */
export interface PlayerCoordinates {
	id: string;
	x: number;
}