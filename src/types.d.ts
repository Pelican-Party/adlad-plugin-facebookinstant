declare class AdInstance {
	/** Preload the ad. The returned promise resolves when the preload completes, and rejects if it failed. */
	loadAsync(): Promise<void>;
	/** Present the ad. The returned promise resolves when user finished watching the ad, and rejects if it failed to present or was closed during the ad. */
	showAsync(): Promise<void>;
}

declare class FBInstant {
	/** Initializes the SDK library. This should be called before any other SDK functions. */
	static initializeAsync(): Promise<void>;

	/** This indicates that the game has finished initial loading and is ready to start. Context information will be up-to-date when the returned promise resolves. */
	static startGameAsync(): Promise<void>;

	/**
	 * Report the game's initial loading progress.
	 * @param percentage A number between 0 and 100.
	 */
	static setLoadingProgress(percentage: number): void;

	/**
	 * Attempt to create an instance of interstitial ad. This instance can then be preloaded and presented.
	 * @param placementID The placement ID that's been setup in your Audience Network settings.
	 */
	static getInterstitialAdAsync(placementID: string): Promise<AdInstance>;
}
