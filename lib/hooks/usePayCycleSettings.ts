import { useEffect, useState } from "react";
import { loadStoredState } from "@/lib/storage/loadStoredState";
import { getNextPaycheckDate, type PayCycle } from "@/lib/payCycle/getNextPaycheckDate";

export function getCurrentDate() {
    const today = new Date();

    return new Date(today.getFullYear(), today.getMonth(), today.getDate())
        .toISOString()
        .slice(0, 10);
}

export function usePayCycleSettings() {
    const [amount, setAmount] = useState(() =>
        loadStoredState("debtPlanner.amount", "")
    );

    const [currentDate, setCurrentDate] = useState(() =>
        loadStoredState("debtPlanner.currentDate", getCurrentDate())
    );

    const [nextPaycheckDate, setNextPaycheckDate] = useState(() =>
        loadStoredState("debtPlanner.nextPaycheckDate", getNextPaycheckDate({
            payCycle: "biweekly",
            currentDate: getCurrentDate(),
        })));

    const [payCycle, setPayCycle] = useState<PayCycle>(() =>
        loadStoredState("debtPlanner.payCycle", "biweekly")
    );

    const [semiMonthlyFirstDay, setSemiMonthlyFirstDay] = useState(() =>
        loadStoredState("debtPlanner.semiMonthlyFirstDay", "1")
    );

    const [semiMonthlySecondDay, setSemiMonthlySecondDay] = useState(() =>
        loadStoredState("debtPlanner.semiMonthlySecondDay", "15")
    );

    const [monthlyPayDay, setMonthlyPayDay] = useState(() =>
        loadStoredState("debtPlanner.monthlyPayDay", "1")
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

    useEffect(() => {
        localStorage.setItem("debtPlanner.amount", JSON.stringify(amount));
    }, [amount]);

    useEffect(() => {
        localStorage.setItem("debtPlanner.payCycle", JSON.stringify(payCycle));
    }, [payCycle]);

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.semiMonthlyFirstDay",
            JSON.stringify(semiMonthlyFirstDay)
        );
    }, [semiMonthlyFirstDay]);

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.semiMonthlySecondDay",
            JSON.stringify(semiMonthlySecondDay)
        );
    }, [semiMonthlySecondDay]);

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.monthlyPayDay",
            JSON.stringify(monthlyPayDay)
        );
    }, [monthlyPayDay]);

    useEffect(() => {
        localStorage.setItem(
            "debtPlanner.currentDate",
            JSON.stringify(currentDate)
        );
    }, [currentDate]);

    useEffect(() => {
        localStorage.setItem("debtPlanner.nextPaycheckDate", JSON.stringify(nextPaycheckDate));
    }, [nextPaycheckDate]);

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
