export async function triggerLightHaptic() {
    await triggerImpact("Light");
}

export async function triggerMediumHaptic() {
    await triggerImpact("Medium");
}

export async function triggerSuccessHaptic() {
    try {
        const { Haptics, NotificationType } = await import("@capacitor/haptics");

        await Haptics.notification({
            type: NotificationType.Success,
        });
    } catch {

    }
}

export async function triggerErrorHaptic() {
    try {
        const { Haptics, NotificationType } = await import("@capacitor/haptics");

        await Haptics.notification({
            type: NotificationType.Error,
        });
    } catch {

    }
}

async function triggerImpact(styleName: "Light" | "Medium") {
    try {
        const { Haptics, ImpactStyle } = await import("@capacitor/haptics");

        await Haptics.impact({
            style:
                styleName === "Light"
                    ? ImpactStyle.Light
                    : ImpactStyle.Medium,
        });
    } catch {
        
    }
}