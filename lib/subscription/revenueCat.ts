import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";

const REVENUECAT_API_KEY = "appl_XUWODZnbbJFPbdMTgBTyKNAGGyp";
const PREMIUM_ENTITLEMENT_ID = "premium";
const BYPASS_REVENUECAT = process.env.NEXT_PUBLIC_BYPASS_REVENUECAT === "";

let hasConfiguredRevenueCat = false;

export async function initializeRevenueCat() {

    if(BYPASS_REVENUECAT) {
        return;
    }

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
        console.warn("RevenueCat init failed", error);
    }
}

export async function getSubscriptionPlan(): Promise<"free" | "premium"> {

    if(BYPASS_REVENUECAT) {
        return "free";
    }

    try {
        const customerInfo = await Purchases.getCustomerInfo();
        const isPremiumActive = customerInfo.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID];

        return isPremiumActive ? "premium" : "free";
    } catch (error) {
        console.warn("Failed to fetch subscription status", error);
        return "free";
    }
}

export async function restorePurchases(): Promise<"free" | "premium"> {

    if (BYPASS_REVENUECAT) {
        return "free";
    }

    await initializeRevenueCat();

    const customerInfo = await Purchases.restorePurchases();

    const isPremiumActive = Boolean(customerInfo.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);

    return isPremiumActive ? "premium" : "free";
}

export async function purchasePremium(): Promise<"free" | "premium"> {

    if (BYPASS_REVENUECAT) {
        return "free";
    }

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

export async function resetRevenueCatUserForTesting(): Promise<"free" | "premium"> {
    if (BYPASS_REVENUECAT) {
        return "free";
    }

    await initializeRevenueCat();

    await Purchases.logOut();

    const customerInfo = await Purchases.getCustomerInfo();

    const isPremiumActive = Boolean(customerInfo.customerInfo.entitlements.active[PREMIUM_ENTITLEMENT_ID]);

    console.log("RevenueCat reet customer info", customerInfo);

    return isPremiumActive ? "premium" : "free";
}