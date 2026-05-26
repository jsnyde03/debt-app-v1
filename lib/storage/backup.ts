export function downloadBackup(date: unknown) {
    const blob = new Blob(
        [JSON.stringify(date, null, 2)],
        { type: "application/json"}
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `debt-app-backup-${new Date().toISOString().slice(0, 10)}.json`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

export async function readBackupFile(file: File) {
    const text = await file.text();

    return JSON.parse(text);
}