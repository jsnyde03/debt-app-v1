import { usePersistedState } from "@/lib/storage/usePersistedState";
import { getNextPaycheckDate, type PayCycle } from "@core/payCycle/getNextPaycheckDate";

export function getCurrentDate() {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), today.getDate())
        .toISOString()
        .slice(0, 10);
}

export function usePayCycleSettings() {
    const [amount, setAmount] = usePersistedState("debtPlanner.amount", "");

    const [currentDate, setCurrentDate] = usePersistedState(
        "debtPlanner.currentDate",
        getCurrentDate()
    );

    const [nextPaycheckDate, setNextPaycheckDate] = usePersistedState(
        "debtPlanner.nextPaycheckDate",
        getNextPaycheckDate({ payCycle: "biweekly", currentDate: getCurrentDate() })
    );

    const [payCycle, setPayCycle] = usePersistedState<PayCycle>(
        "debtPlanner.payCycle",
        "biweekly"
    );

    const [semiMonthlyFirstDay, setSemiMonthlyFirstDay] = usePersistedState(
        "debtPlanner.semiMonthlyFirstDay",
        "1"
    );

    const [semiMonthlySecondDay, setSemiMonthlySecondDay] = usePersistedState(
        "debtPlanner.semiMonthlySecondDay",
        "15"
    );

    const [monthlyPayDay, setMonthlyPayDay] = usePersistedState(
        "debtPlanner.monthlyPayDay",
        "1"
    );

    function hasValidPayCycleInputs() {
        if (payCycle === "semimonthly") {
            const first = Number(semiMonthlyFirstDay);
            const second = Number(semiMonthlySecondDay);

            return (
                first >= 1 &&
                first <= 31 &&
                second >= 1 &&
                second <= 31 &&
                first !== second
            );
        }

        if (payCycle === "monthly") {
            const day = Number(monthlyPayDay);
            return day >= 1 && day <= 31;
        }

        return true;
    }

    return {
        amount,
        setAmount,
        currentDate,
        setCurrentDate,
        nextPaycheckDate,
        setNextPaycheckDate,
        payCycle,
        setPayCycle,
        semiMonthlyFirstDay,
        setSemiMonthlyFirstDay,
        semiMonthlySecondDay,
        setSemiMonthlySecondDay,
        monthlyPayDay,
        setMonthlyPayDay,
        hasValidPayCycleInputs,
    };
}
