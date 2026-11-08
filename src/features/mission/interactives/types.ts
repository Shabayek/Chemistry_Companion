import type { InteractiveDataMap, InteractiveKind, StepResult } from '../../../types';

export interface InteractiveProps<K extends InteractiveKind> {
  data: InteractiveDataMap[K] | undefined;
  /** Called when the step's task is finished (may be called again, e.g. after "Play again"; the best score counts). */
  onComplete: (result: StepResult) => void;
}
