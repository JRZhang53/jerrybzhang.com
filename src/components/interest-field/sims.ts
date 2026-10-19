import { SpinLattice } from './spin-lattice';
import { Swarm } from './swarm';
import { CoupledWaveguides } from './coupled-waveguides';
import { Boltzmann } from './boltzmann';
import type { Sim, SimKey } from './types';

export type { Pointer, Rgb, Sim, SimKey } from './types';
export { SpinLattice, Swarm, CoupledWaveguides, Boltzmann };

export const SIMS: Record<SimKey, { create: () => Sim; caption: string; touchCaption: string }> = {
  spins: {
    create: () => new SpinLattice(),
    caption: 'Ising spins near the critical temperature. Your cursor heats them, so they flip at random.',
    touchCaption: 'Ising spins near the critical temperature. Tap to briefly heat a spot.',
  },
  swarm: {
    create: () => new Swarm(),
    caption: 'A Vicsek swarm: each agent follows its neighbors. Your cursor scatters them.',
    touchCaption: 'A Vicsek swarm: each agent follows its neighbors. Tap to scatter them.',
  },
  photonics: {
    create: () => new CoupledWaveguides(),
    caption: 'Coupled waveguides: each core confines light, which tunnels across where evanescent tails overlap. Touch a guide to send a pulse.',
    touchCaption: 'Light travels between coupled waveguides. Tap a guide to send a pulse.',
  },
  boltzmann: {
    create: () => new Boltzmann(),
    caption: 'A Boltzmann machine, Gibbs sampling one unit at a time. Click a unit to clamp it on.',
    touchCaption: 'A Boltzmann machine, sampling one unit at a time. Tap a unit to clamp or release it.',
  },
};
