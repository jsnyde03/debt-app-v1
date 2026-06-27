export function downloadBackup(data: unknown) {
    const backupText = JSON.stringify(data, null, 2);
    const fileName = `debt-planner-backup-${new Date().toISOString().slice(0, 10)}.json`;

    const file = new File([backupText], fileName, {
        type: "application/json",
    });

    if (navigator.canShare?.({ files: [file] })) {
        navigator.share({
            title: "Debt Planner Backup",
            text: "Debt Planner Backup File",
            files: [file],
        });

        return;
    }

    const blob = new Blob([backupText], {
        type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

const BACKUP_ARRAY_FIELDS = [
    "requiredExpenses",
    "livingExpenses",
    "debts",
    "goals",
    "completedRecommendedActions",
] as const;

function assertValidBackupShape(data: unknown): void {
    if (typeof data !== "object" || data === null) {
        throw new Error("Backup file is not a valid backup (not an object).");
    }

    const record = data as Record<string, unknown>;

    for (const field of BACKUP_ARRAY_FIELDS) {
        if (field in record && !Array.isArray(record[field])) {
            throw new Error(`Backup file is malformed: "${field}" should be a list.`);
        }
    }
}

export async function readBackupFile(file: File) {
    const text = await file.text();
    const data = JSON.parse(text);

    assertValidBackupShape(data);

    return data;
}