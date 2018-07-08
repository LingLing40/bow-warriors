export interface LifeCycle {
	preload(): void;
	create(): void;
	update(time: number, delta: number): void;
}