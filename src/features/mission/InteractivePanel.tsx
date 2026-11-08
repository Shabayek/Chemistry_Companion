import type { MissionStep, StepResult } from '../../types';
import { AtomBuilder, SymbolMatch, Sorter, MoleculeMaker, PeriodicExplorer, BondBuilder } from './interactives/basics';
import { EquationBalancer, LabMix, PhSlider, Stoichiometry, ReactionClassifier, GasLaw, OrganicBuilder, Redox } from './interactives/reactions';
import { Equilibrium, Thermo, Kinetics, CellBuilder, Decay } from './interactives/advanced';
import { AtomCounter, PolymerBuilder, BufferLab, ElectronConfigBuilder } from './interactives/builders';

const noop = () => {};

/**
 * Renders the interactive widget for one practice step. Widgets report completion through `onComplete`.
 * The switch is exhaustive over InteractiveKind, and `step.data` is typed for each kind.
 */
export default function InteractivePanel({ step, onComplete = noop }: { step: MissionStep; onComplete?: (result: StepResult) => void }) {
  switch (step.interactive) {
    case 'atom-builder': return <AtomBuilder data={step.data} onComplete={onComplete} />;
    case 'symbol-match': return <SymbolMatch data={step.data} onComplete={onComplete} />;
    case 'state-sorter': return <Sorter data={step.data} onComplete={onComplete} />;
    case 'molecule-maker': return <MoleculeMaker data={step.data} onComplete={onComplete} />;
    case 'periodic-explorer': return <PeriodicExplorer data={step.data} onComplete={onComplete} />;
    case 'bond-builder': return <BondBuilder data={step.data} onComplete={onComplete} />;
    case 'equation-balancer': return <EquationBalancer data={step.data} onComplete={onComplete} />;
    case 'lab-mix': return <LabMix data={step.data} onComplete={onComplete} />;
    case 'ph-slider': return <PhSlider data={step.data} onComplete={onComplete} />;
    case 'stoichiometry': return <Stoichiometry data={step.data} onComplete={onComplete} />;
    case 'reaction-classifier': return <ReactionClassifier data={step.data} onComplete={onComplete} />;
    case 'gas-law': return <GasLaw data={step.data} onComplete={onComplete} />;
    case 'organic-builder': return <OrganicBuilder data={step.data} onComplete={onComplete} />;
    case 'redox': return <Redox data={step.data} onComplete={onComplete} />;
    case 'equilibrium': return <Equilibrium data={step.data} onComplete={onComplete} />;
    case 'thermo': return <Thermo data={step.data} onComplete={onComplete} />;
    case 'kinetics': return <Kinetics data={step.data} onComplete={onComplete} />;
    case 'cell-builder': return <CellBuilder data={step.data} onComplete={onComplete} />;
    case 'decay': return <Decay data={step.data} onComplete={onComplete} />;
    case 'sorter': return <Sorter data={step.data} onComplete={onComplete} />;
    case 'atom-counter': return <AtomCounter data={step.data} onComplete={onComplete} />;
    case 'polymer-builder': return <PolymerBuilder data={step.data} onComplete={onComplete} />;
    case 'buffer': return <BufferLab data={step.data} onComplete={onComplete} />;
    case 'electron-config': return <ElectronConfigBuilder data={step.data} onComplete={onComplete} />;
    default: {
      // Exhaustiveness check: adding a new InteractiveKind without a renderer is a compile error.
      const unhandled: never = step;
      return <div className="text-muted">Interactive "{String((unhandled as MissionStep).interactive)}" coming soon.</div>;
    }
  }
}
