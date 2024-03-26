export function facebookInstantPlugin() {
	let initializeCalled = false;
	let loadStartCalled = false;
	let loadStopCalled = false;

	/** @typedef {"interstitial" | "rewarded-interstitial" | "rewarded-video"} ShowAdType */

	/** @type {Map<string, Promise<AdInstance>>} */
	const cachedAdInstances = new Map();

	/**
	 * Creates and caches an ad instance.
	 * Subsequent calls will result in the same instance.
	 * @param {ShowAdType} type
	 * @param {string} placementId
	 */
	function getAdInstance(type, placementId) {
		const key = type + "-" + placementId;
		const existing = cachedAdInstances.get(key);
		if (existing) return existing;
		let ad;
		if (type == "interstitial") {
			ad = FBInstant.getInterstitialAdAsync(placementId);
		} else if (type == "rewarded-interstitial") {
			ad = FBInstant.getRewardedInterstitialAsync(placementId);
		} else if (type == "rewarded-video") {
			ad = FBInstant.getRewardedVideoAsync(placementId);
		} else {
			throw new Error("unknown ad type");
		}
		cachedAdInstances.set(key, ad);
		return ad;
	}

	/**
	 * @param {"interstitial" | "rewarded-interstitial" | "rewarded-video"} type
	 * @param {string} placementId
	 */
	async function showAd(type, placementId) {
		const ad = await getAdInstance(type, placementId);
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
	}

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
		async showFullScreenAd({ placementId }) {
			return await showAd("interstitial", placementId);
		},
		/**
		 * @param {Object} options
		 * @param {"interstitial" | "video"} options.type
		 * @param {string} options.placementId
		 */
		async showRewardedAd({ type, placementId }) {
			/** @type {ShowAdType} */
			let showAdType;
			if (type == "interstitial") {
				showAdType = "rewarded-interstitial";
			} else if (type == "video") {
				showAdType = "rewarded-video";
			} else {
				throw new Error("Unknown ad type");
			}
			return await showAd(showAdType, placementId);
		},
	});

	return plugin;
}
