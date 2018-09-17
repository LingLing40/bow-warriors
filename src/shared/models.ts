export enum Team {
	BLUE = 'blue',
	RED = 'red'
}

export enum Character {
	WARRIOR = 'warrior',
	PRINCESS = 'princess',
	ORC = 'orc',
	DEFAULT = 'base'
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

export interface TeamBase {
	id: integer;
	name: string;
	width: number;
	height: number;
	x: number;
	y: number;
	properties: {
		team: Team;
	};
	type: string; // 'base'
}

/**
 * Setup information for server, e.g. for data
 * that is based on the used tilemap
 */
export interface SetupData {
	bases: TeamBase[];
}

/**
 * Total points stored per team
 */
export interface PointsData {
	[key: string]: number;
}

/**
 * PlayerData stored on server and on clients
 */
export interface PlayerData {
	id: string;
	name: string;
	character: Character;
	team: Team;
	x: number;
	y: number;
	velocityX: number;
	velocityY: number;
	animation: CharacterAnimation;
	health: number;
}

/**
 * Extended player data on server, containing statistics
 */
export interface ServerPlayerData extends PlayerData {
	statisticArrows: number; // total number of arrows shot
	statisticDied: number; // number of times own player died
	statisticSelfHit: number; // all hits against own player
	statisticOtherTotalHit: number; // all hits to others
	statisticFriendlyFire: number; // part of total hits against own team
	statisticOtherDeadlyHit: number; // part of total hits that was deadly (against other team)
}

/**
 * List of all Players on server
 */
export interface AllPlayerData {
	[key: string]: ServerPlayerData;
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
	team: Team;
	x: number;
	y: number;
	posDiffX: number;
	posDiffY: number;
	angle: number;
	created?: integer;
}

/**
 * List of all arrows on server
 */
export interface AllArrowData {
	[key: string]: ArrowData;
}

/**
 * Data sent by client when player was hit by arrow
 */
export interface PlayerHitData {
	playerId: string;
	arrowId: string;
}

/**
 * Data sent by server to inform clients about a player hit
 */
export interface PlayerHealthData {
	id: string;
	health: number;
}

/**
 * General coordinate update
 */
export interface CoordinatesData {
	id: string;
	x: number;
	y: number;
}

/**
 * Coordinate update for player
 */
export interface PlayerCoordinates extends CoordinatesData {
	velocityX: number;
	velocityY: number;
	animation: CharacterAnimation;
}

/**
 * Coordinate update for arrow
 */
export interface ArrowCoordinates extends CoordinatesData {
	velocityX: number;
	velocityY: number;
}

export interface PlayerReviveData {
	id: string;
	x: number;
	y: number;
	health: number;
}