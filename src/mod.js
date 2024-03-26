export function facebookInstantPlugin() {
	let initializeCalled = false;
	let loadStartCalled = false;
	let loadStopCalled = false;

	/** @satisfies {import("$adlad").AdLadPlugin} */
	const plugin = /** @type {const} */ ({
		name: "facebookinstant",
		async initialize(ctx) {
			if (initializeCalled) {
				throw new Error("Facebook Instant Games plugin is being initialized more than once");
			}
			initializeCalled = true;

			await ctx.loadScriptTag("https://connect.facebook.net/en_US/fbinstant.7.1.js");

			await FBInstant.initializeAsync();
		},
		loadStart() {
			if (loadStartCalled) return;
			loadStartCalled = true;
			FBInstant.setLoadingProgress(50);
		},
		async loadStop() {
			if (loadStopCalled) return;
			loadStopCalled = true;
			await FBInstant.startGameAsync();
		},
		/**
		 * @param {Object} options
		 * @param {string} options.placementId
		 */
		async showFullScreenAd({placementId}) {
			const ad = await FBInstant.getInterstitialAdAsync(placementId);
			try {
				await ad.loadAsync();
				await ad.showAsync();
			} catch (e) {
				/** @type {import("$adlad").AdErrorReason?} */
				let errorReason = null;
				if (e && typeof e == "object" && "code" in e) {
					if (e.code == "ADS_NO_FILL") {
						errorReason = "no-ad-available";
					} else if (e.code == "ADS_FREQUENT_LOAD" || e.code == "RATE_LIMITED") {
						errorReason = "time-constraint";
					} else if (e.code == "USER_INPUT") {
						errorReason = "user-dismissed";
					}
				}
				if (errorReason) {
					return {
						didShowAd: false,
						errorReason,
					};
				} else {
					throw e;
				}
			}
			return {
				didShowAd: true,
				errorReason: null,
			};
		},
	});

	return plugin;
}
