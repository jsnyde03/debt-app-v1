import { Purchases, LOG_LEVEL } from "@revenuecat/purchases-capacitor";

const REVENUECAT_API_KEY = "appl_XUWODZnbbJFPbdMTgBTyKNAGGyp";
const PREMIUM_ENTITLEMENT_ID = "premium";
const BYPASS_REVENUECAT = process.env.NEXT_PUBLIC_BYPASS_REVENUECAT === "";

let hasConfiguredRevenueCat = false;

export type PremiumPackageInfo = {
    title: string;
    priceString: string;
    periodLabel: string;
};

// ISO 8601 duration -> a short human label. Only the patterns RevenueCat
// actually returns for subscription products are handled.
function formatSubscriptionPeriod(period: string | null): string {
    switch (period) {
        case "P1W":
            return "week";
        case "P1M":
            return "month";
        case "P3M":
            return "3 months";
        case "P6M":
            return "6 months";
        case "P1Y":
            return "year";
        default:
            return "billing period";
    }
}

async function getMonthlyPackage() {
    const offerings = await Purchases.getOfferings();
    const currentOffering = offerings.current;
    const monthlyPackage = currentOffering?.monthly ?? currentOffering?.availablePackages?.[0];

    if (!currentOffering) {
        throw new Error("No current RevenueCat offering found.");
    }

    if (!monthlyPackage) {
        throw new Error("No RevenueCat monthly package found");
    }

    return monthlyPackage;
}

export async function getPremiumPackageInfo(): Promise<PremiumPackageInfo | null> {
    if (BYPASS_REVENUECAT) {
        return {
            title: "Premium Monthly",
            priceString: "$4.99",
            periodLabel: "month",
        };
    }

    try {
        await initializeRevenueCat();

        const monthlyPackage = await getMonthlyPackage();
        const product = monthlyPackage.product;

        return {
            title: product.title || "Premium Monthly",
            priceString: product.priceString,
            periodLabel: formatSubscriptionPeriod(product.subscriptionPeriod),
        };
    } catch (error) {
        console.warn("Failed to fetch premium package info", error);
        return null;
    }
}

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
        console.error("RevenueCat init failed", error);
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
        console.error("Failed to fetch subscription status", error);
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

    const monthlyPackage = await getMonthlyPackage();

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