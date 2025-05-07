import { Loader2 } from "lucide-react";

type LoadingOverlayProps = {
    message?: string
}

export function LoadingOverlay({ message = "Processing..." }: LoadingOverlayProps) {
    return (
        <div className = "fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50" >
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl flex flex-col items-center max-w-md mx-4 border border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <Loader2 className="h-12 w-12 text-slate-700 dark:text-slate-300 animate-spin" />
                </div>
                <p className="mt-4 text-slate-700 dark:text-slate-200 font-medium text-center">{message}</p>
                <div className="mt-3 flex space-x-1">
                    {[0, 1, 2].map((i) => (
                        <div
                            key={i}
                            className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500 animate-pulse"
                            style={{ animationDelay: `${i * 0.2}s` }}
                        />
                    ))}
                </div>
            </div>
      </div >
    );
}
