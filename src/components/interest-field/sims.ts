import { SpinLattice } from './spin-lattice';
import { Swarm } from './swarm';
import { CoupledWaveguides } from './coupled-waveguides';
import { Boltzmann } from './boltzmann';
import type { Sim, SimKey } from './types';

export type { Pointer, Rgb, Sim, SimKey } from './types';
export { SpinLattice, Swarm, CoupledWaveguides, Boltzmann };

export const SIMS: Record<SimKey, { create: () => Sim; caption: string }> = {
  spins: {
    create: () => new SpinLattice(),
    caption: 'Ising spins near the critical temperature. Your cursor heats them, so they flip at random.',
  },
  swarm: {
    create: () => new Swarm(),
    caption: 'A Vicsek swarm: each agent follows its neighbors. Your cursor scatters them.',
  },
  photonics: {
    create: () => new CoupledWaveguides(),
    caption: 'Coupled waveguides: each core confines light, which tunnels across where evanescent tails overlap. Touch a guide to send a pulse.',
  },
  boltzmann: {
    create: () => new Boltzmann(),
    caption: 'A Boltzmann machine, Gibbs sampling one unit at a time. Click a unit to clamp it on.',
  },
};
