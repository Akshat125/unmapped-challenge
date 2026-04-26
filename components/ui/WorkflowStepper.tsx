import Link from 'next/link';

// Horizontal workflow stepper. Active step is prop-driven, not
// URL-derived — so detail routes (e.g., /ngo/[id]) can still show a
// meaningful step without invalid active-path logic.
//
// Visual: connected nodes. Completed steps are filled navy, the active
// step is outlined navy with filled accent, future steps are muted gray.

export interface StepDefinition {
  label: string;
  href?: string; // if absent, the step is non-navigable (current/future)
}

interface WorkflowStepperProps {
  steps: StepDefinition[];
  currentIndex: number; // 0-based
  className?: string;
}

export function WorkflowStepper({ steps, currentIndex, className = '' }: WorkflowStepperProps) {
  const totalSteps = steps.length;

  return (
    <nav
      aria-label="Workflow progress"
      className={`relative flex flex-wrap items-center gap-1 text-xs ${className}`}
    >
      <span className="mr-3 font-semibold uppercase tracking-widest text-wb-ink/50">
        Step {currentIndex + 1} of {totalSteps}
      </span>
      <ol className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-2">
        {steps.map((step, i) => {
          const isActive = i === currentIndex;
          const isComplete = i < currentIndex;
          const isLast = i === steps.length - 1;
          const node = (
            <span
              className={`inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full border px-2 text-[11px] font-semibold ${
                isActive
                  ? 'border-wb-navy bg-wb-navy text-white'
                  : isComplete
                    ? 'border-wb-navy bg-white text-wb-navy'
                    : 'border-wb-line bg-white text-wb-ink/40'
              }`}
              aria-current={isActive ? 'step' : undefined}
            >
              {i + 1}
            </span>
          );
          const label = (
            <span
              className={`ml-2 ${
                isActive
                  ? 'font-medium text-wb-navy'
                  : isComplete
                    ? 'text-wb-ink/70'
                    : 'text-wb-ink/40'
              }`}
            >
              {step.label}
            </span>
          );
          return (
            <li key={i} className="flex items-center">
              {step.href && !isActive ? (
                <Link
                  href={step.href}
                  className="inline-flex items-center rounded px-1 py-0.5 hover:text-wb-blue focus:outline-none focus-visible:ring-2 focus-visible:ring-wb-blue"
                >
                  {node}
                  {label}
                </Link>
              ) : (
                <span className="inline-flex items-center px-1 py-0.5">
                  {node}
                  {label}
                </span>
              )}
              {!isLast && (
                <span
                  aria-hidden
                  className={`mx-1 h-px w-4 ${
                    isComplete ? 'bg-wb-navy' : 'bg-wb-line'
                  }`}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
