import { useState } from "react";

export default function PostureGuide() {
    const [showGuide, setShowGuide] = useState(false);

    return (
        <>
        <div className="rounded-3xl bg-slate-900/90 p-5 text-white shadow-xl shadow-slate-950/20">
            <button
                className="w-full rounded-2xl bg-slate-700/70 px-5 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:bg-slate-600/80"
                onClick={() => setShowGuide((prev) => !prev)}
            >
                {showGuide ? "Hide posture guide" : "Show posture guide"}
            </button>

            {showGuide && (
                <div className="mt-5 space-y-5">
                    <h3 className="text-lg font-semibold text-slate-100">Try these changes to maintain a good posture</h3>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="rounded-3xl bg-slate-800/75 p-4 shadow-inner shadow-slate-950/20">
                            <p className="mb-3 text-sm font-semibold text-slate-200">Shoulders</p>
                            <ul className="space-y-2 text-sm leading-6 text-slate-200">
                                <li className="list-disc list-inside">Keep both shoulders vertically aligned</li>
                                <li className="list-disc list-inside">Keep them relaxed and down</li>
                                <li className="list-disc list-inside">Avoid hunching or rounding</li>
                            </ul>
                        </div>
                        <div className="rounded-3xl bg-slate-800/75 p-4 shadow-inner shadow-slate-950/20">
                            <p className="mb-3 text-sm font-semibold text-slate-200">Spine</p>
                            <ul className="space-y-2 text-sm leading-6 text-slate-200">
                                <li className="list-disc list-inside">Sit up straight</li>
                                <li className="list-disc list-inside">Try to sit with your chest forward</li>
                                <li className="list-disc list-inside">Keep your spine in a neutral position</li>
                            </ul>
                        </div>
                        <div className="rounded-3xl bg-slate-800/75 p-4 shadow-inner shadow-slate-950/20">
                            <p className="mb-3 text-sm font-semibold text-slate-200">Head</p>
                            <ul className="space-y-2 text-sm leading-6 text-slate-200">
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