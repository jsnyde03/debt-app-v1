import next from "next";

export type PayCycle = "weekly" | "biweekly" | "semimonthly" | "monthly";

export type PayCycleConfig = {
	payCycle: PayCycle;
	currentDate: string;
	semiMonthlyFirstDay?: number;
	semiMonthlySecondDay?: number;
	monthlyPayDay?: number;
};

function toDate(date: string) {
	return new Date(`${date}T00:00:00`);
}

function toDateString(date: Date) {
	return date.toISOString().slice(0, 10);
}

function clampDay(year: number, month: number, day: number) {
	return Math.min(day, new Date(year, month + 1, 0).getDate());
}

function validateDayOfTheMonth(day: number | undefined, label: string) {
	if (!day || day < 1 || day > 31) {
		throw new Error(`${label} must be between 1 and 31`);
	}
}

export function getNextPaycheckDate({
	payCycle,
	currentDate,
	semiMonthlyFirstDay,
	semiMonthlySecondDay,
	monthlyPayDay,
}: PayCycleConfig): string {
	const today = toDate(currentDate);

	if (payCycle === "weekly") {
		const next = new Date(today);
		next.setDate(next.getDate() + 7);
		return toDateString(next);
	}

	if (payCycle === "biweekly") {
		const next = new Date(today);
		next.setDate(next.getDate() + 14);
		return toDateString(next);
	}

	if (payCycle === "semimonthly") {
		validateDayOfTheMonth(semiMonthlyFirstDay, "First semi-monthly pay day");
		validateDayOfTheMonth(semiMonthlySecondDay, "Second semi-monthly pay day");

		if (semiMonthlyFirstDay === semiMonthlySecondDay) {
			throw new Error("Semi-monthly pay days must be different.");
		}

		const year = today.getFullYear();
		const month = today.getMonth();

		const candidates = [
			new Date(year, month, clampDay(year, month, semiMonthlyFirstDay!)),
			new Date(year, month, clampDay(year, month, semiMonthlySecondDay!)),
			new Date(year, month + 1, clampDay(year, month + 1, semiMonthlyFirstDay!)),
			new Date(year, month + 1, clampDay(year, month + 1, semiMonthlySecondDay!)),
		].filter((date) => date > today).sort((a, b) => a.getTime() - b.getTime());

		return toDateString(candidates[0]);
	}

	if (payCycle === "monthly") {
		validateDayOfTheMonth(monthlyPayDay, "Monthly pay day");

		const payDay = monthlyPayDay ?? 1;
		const year = today.getFullYear();
		const month = today.getMonth();

		const thisMonthPayday = new Date(year, month, clampDay(year, month, payDay));
		const nextMonthPayday = new Date(year, month + 1, clampDay(year, month + 1, payDay));

		return toDateString(thisMonthPayday > today ? thisMonthPayday : nextMonthPayday);
	}

	throw new Error("Unsupported pay cycle");
}