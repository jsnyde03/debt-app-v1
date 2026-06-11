import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";

const REVENUECAT_API_KEY = "appl_XUWODZnbbJFPbdMTgBTyKNAGGyp";
const PREMIUM_ENTITLEMENT_ID = "premium";

let hasConfiguredRevenueCat = false;

export async function initializeRevenueCat() {
    if (hasConfiguredRevenueCat) {
        return;
    }

    try {
        await Purchases.setLogLevel({
            level: LOG_LEVEL.DEBUG,
        });

        await Purchases.configure({
            apiKey: REVENUECAT_API_KEY,
        });

        hasConfiguredRevenueCat = true;
    } catch (error) {
        console.error("RevenueCat init failed", error);
    }
}

export async function getSubscriptionPlan(): Promise<"free" | "premium"> {
    try {
        const customerInfo = await Purchases.getCustomerInfo();
        const isPremiumActive = customerInfo.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];

        return isPremiumActive ? "premium" : "free";
    } catch (error) {
        console.error("Failed to fetch subscription status", error);
        return "free";
    }
}

export async function purchasePremium(): Promise<"free" | "premium"> {

    await initializeRevenueCat();

    const offerings = await Purchases.getOfferings();
    console.log("Revenue offerings", offerings);

    const currentOffering = offerings.current;
    const monthlyPackage = currentOffering?.monthly ?? currentOffering?.availablePackages?.[0];

    if (!currentOffering) {
        throw new Error("No current RevenueCat offering found.");
    }

    if (!monthlyPackage) {
        throw new Error("No RevenueCat monthly package found");
    }

    const purchaseResult = await Purchases.purchasePackage({
        aPackage: monthlyPackage,
    });

    console.log("Revenue purchase result", purchaseResult);

    const isPremiumActive = Boolean(purchaseResult.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);

    if (!isPremiumActive) {
        throw new Error("Purchase completed, but premium entitlement is not active.");
    }

    return "premium";
}