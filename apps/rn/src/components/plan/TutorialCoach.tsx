import { TutorialOverlay } from '@/components/plan/TutorialOverlay';
import { appStore } from '@/store/appStore';
import { TUTORIAL_STEPS, TUTORIAL_STEP_COUNT, isLastStep, nextIndex, prevIndex, stepBody } from '@/store/tutorialPath';
import { markTutorialSeen } from '@/store/tutorialSelectors';
import { tutorialSession, useTutorialSession } from '@/store/tutorialSession';
import { useTutorialShell } from '@/store/tutorialShell';

/**
 * 3.5.3.5.7 — the walkthrough's coaching layer, mounted at the ROOT so its scrim covers the whole
 * canvas (the iPad sidebar rail included, which is what prompted the move).
 *
 * It reads the session directly, because that is global state: the beat's copy, its position and the
 * leave/step handlers all live there, so nothing has to be threaded down through the navigator. The one
 * thing it cannot know by itself is where the beat's SUBJECT is — only the coached screen can measure
 * that — which arrives through `TutorialShell`, along with the payoff the screen derives.
 *
 * Mounted unconditionally for the app's lifetime and rendering null outside a session, so every hook
 * runs on every launch in the same order.
 */
export function TutorialCoach() {
  const active = useTutorialSession((s) => s.active);
  const index = useTutorialSession((s) => s.index);
  const run = useTutorialSession((s) => s.run);
  const shell = useTutorialShell();
  if (!active || !shell) return null;

  const step = TUTORIAL_STEPS[index];
  if (!step) return null;
  const last = isLastStep(index);

  const leave = () => {
    const prefs = appStore.getState().store.prefs;
    appStore.getState().updatePrefs({ ...markTutorialSeen(prefs, tutorialSession.getState().run), tutorialStep: null });
    tutorialSession.getState().end();
  };
  const goTo = (next: number) => {
    tutorialSession.getState().goTo(next);
    appStore.getState().updatePrefs({ tutorialStep: next });
  };

  return (
    <TutorialOverlay
      position={index + 1}
      total={TUTORIAL_STEP_COUNT}
      title={step.title}
      body={stepBody(step, run, shell.subjectMissing)}
      isLast={last}
      run={run}
      spotlight={shell.spotlight}
      subjectMissing={shell.subjectMissing}
      // From the SHELL, not from `INTERACTIVE_STEP_IDS`: the beat being interactive isn't sufficient, and
      // only the screen can see that the spotlight has moved onto the beat's payoff. See `passThrough`.
      passThrough={shell.passThrough}
      onDockLayout={shell.setDockH}
      impact={shell.impact}
      onBack={index > 0 ? () => goTo(prevIndex(index)) : undefined}
      onNext={() => (last ? leave() : goTo(nextIndex(index)))}
      onSkip={leave}
    />
  );
}
