"use client";

export default function Error({
    reset,
} : {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <main className="app">
            <section className="card">
                <h1>Somethng went wrong</h1>
                <p className="empty-state">
                    The planner hit an unexpected error.  Your saved data should still be preserved locally.
                </p>

                <button type="button" onClick={reset}>
                    Try again
                </button>
            </section>
        </main>
    )
}