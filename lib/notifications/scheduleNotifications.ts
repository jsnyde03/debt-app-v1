import { LocalNotifications } from "@capacitor/local-notifications";
import type { RequiredExpense } from "@/lib/storage/debtPlannerStorage";

const ID_PAYCHECK_EVE = 1001;
const ID_BILLS_ALERT = 1002;
const ID_PAYDAY_CAPTURE = 1003;

export async function requestNotificationPermission(): Promise<boolean> {
    const { display } = await LocalNotifications.requestPermissions();
    return display === "granted";
}

export async function hasNotificationPermission(): Promise<boolean> {
    const { display } = await LocalNotifications.checkPermissions();
    return display === "granted";
}

type ScheduleParams = {
    nextPaycheckDate: string;
    requiredExpenses: RequiredExpense[];
};

export async function scheduleNotifications({ nextPaycheckDate, requiredExpenses }: ScheduleParams) {
    if (!nextPaycheckDate) return;

    await LocalNotifications.cancel({
        notifications: [{ id: ID_PAYCHECK_EVE }, { id: ID_BILLS_ALERT }, { id: ID_PAYDAY_CAPTURE }],
    });

    const now = new Date();

    // Paycheck-eve reminder: 8pm the night before payday.
    const paycheckDate = new Date(nextPaycheckDate + "T00:00:00");
    const paycheckEve = new Date(paycheckDate);
    paycheckEve.setDate(paycheckEve.getDate() - 1);
    paycheckEve.setHours(20, 0, 0, 0);

    const notifications = [];

    if (paycheckEve > now) {
        notifications.push({
            id: ID_PAYCHECK_EVE,
            title: "Paycheck Tomorrow",
            body: "Your paycheck arrives tomorrow — open Debt Planner to run your plan.",
            schedule: { at: paycheckEve },
        });
    }

    // Payday-morning capture prompt: 9am ON payday. This is the Payday Autopilot
    // trigger — the capture sheet auto-opens once today has reached the payday, so
    // this brings the user in at the right moment to confirm what they paid.
    const paydayMorning = new Date(paycheckDate);
    paydayMorning.setHours(9, 0, 0, 0);

    if (paydayMorning > now) {
        notifications.push({
            id: ID_PAYDAY_CAPTURE,
            title: "It's payday 🎉",
            body: "Open Debt Planner to confirm your plan for this paycheck.",
            schedule: { at: paydayMorning },
        });
    }

    // Bills alert: 8pm two days before the earliest upcoming unpaid bill,
    // but only if that day is different from the paycheck-eve reminder day.
    const upcomingUnpaidBills = requiredExpenses
        .filter((e) => !e.isPaidThisCycle && e.dueDate > now.toISOString().slice(0, 10))
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const earliestBill = upcomingUnpaidBills[0];

    if (earliestBill) {
        const billDate = new Date(earliestBill.dueDate + "T00:00:00");
        const billAlert = new Date(billDate);
        billAlert.setDate(billAlert.getDate() - 2);
        billAlert.setHours(20, 0, 0, 0);

        const isSameDayAsPaycheckEve =
            billAlert.toDateString() === paycheckEve.toDateString();

        if (billAlert > now && !isSameDayAsPaycheckEve) {
            const count = upcomingUnpaidBills.length;
            notifications.push({
                id: ID_BILLS_ALERT,
                title: count === 1 ? "Upcoming Bill" : `${count} Upcoming Bills`,
                body:
                    count === 1
                        ? `${earliestBill.name} is due soon — check your plan.`
                        : `${earliestBill.name} and ${count - 1} more due soon — check your plan.`,
                schedule: { at: billAlert },
            });
        }
    }

    if (notifications.length > 0) {
        await LocalNotifications.schedule({ notifications });
    }
}

export async function cancelAllNotifications() {
    await LocalNotifications.cancel({
        notifications: [{ id: ID_PAYCHECK_EVE }, { id: ID_BILLS_ALERT }, { id: ID_PAYDAY_CAPTURE }],
    });
}
