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

export async function readBackupFile(file: File) {
    const text = await file.text();

    return JSON.parse(text);
}