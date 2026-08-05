import { useState } from "react";

export default function PostureGuide() {
    const [showGuide, setShowGuide] = useState(false);

    return (
        <>
        <div className="glass-card rounded-3xl p-5 text-[var(--color-text)] shadow-xl shadow-black/20">
            <button
                className="guide-toggle-button"
                onClick={() => setShowGuide((prev) => !prev)}
            >
                {showGuide ? "Hide posture guide" : "Show posture guide"}
            </button>

            {showGuide && (
                <div className="mt-5 space-y-5">
                    <h3 className="text-lg font-semibold text-[var(--color-accent)]">Try these changes to maintain a good posture</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="guide-tip-card">
                            <p className="mb-3 text-sm font-semibold text-[var(--color-text-heading)]">Shoulders</p>
                            <ul className="space-y-2 text-sm leading-6 text-[var(--color-text-muted)]">
                                <li className="list-disc list-inside">Keep both shoulders vertically aligned</li>
                                <li className="list-disc list-inside">Keep them relaxed and down</li>
                                <li className="list-disc list-inside">Avoid hunching or rounding</li>
                            </ul>
                        </div>
                        <div className="guide-tip-card">
                            <p className="mb-3 text-sm font-semibold text-[var(--color-text-heading)]">Spine</p>
                            <ul className="space-y-2 text-sm leading-6 text-[var(--color-text-muted)]">
                                <li className="list-disc list-inside">Sit up straight</li>
                                <li className="list-disc list-inside">Try to sit with your chest forward</li>
                                <li className="list-disc list-inside">Keep your spine in a neutral position</li>
                            </ul>
                        </div>
                        <div className="guide-tip-card">
                            <p className="mb-3 text-sm font-semibold text-[var(--color-text-heading)]">Head</p>
                            <ul className="space-y-2 text-sm leading-6 text-[var(--color-text-muted)]">
                                <li className="list-disc list-inside">Keep your head straight</li>
                                <li className="list-disc list-inside">Do not push your head forward</li>
                                <li className="list-disc list-inside">Avoid hunching or rounding</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </>)
    
}