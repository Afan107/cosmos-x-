import { STELLA_CORES } from './stellaCoreEngine';

export interface StellaChatMessage {
  id: string;
  stellaId: string;
  role: 'user' | 'assistant' | 'pythagoras_filter';
  content: string;
  eli10Summary?: string;
  targetId?: string;
  timestamp: string;
}

/**
 * Generates an authoritative in-character response from any of the 7 Stella-Core minds,
 * accompanied by a clean, noise-filtered ELI10 translation distilled by Pythagoras.
 */
export function generateStellaChatResponse(
  stellaId: string,
  userPrompt: string,
  targetContext: { name: string; anomalyTitle?: string; spectralType?: string }
): { response: string; eli10: string } {
  const mind = STELLA_CORES[stellaId] || STELLA_CORES.STELLA_01;
  const target = targetContext.name || 'TIC-25155310';
  const query = userPrompt.trim().toLowerCase();

  switch (mind.id) {
    case 'STELLA_01': // Albert Einstein
      if (query.includes('black hole') || query.includes('little red dot') || query.includes('triple') || query.includes('fission')) {
        return {
          response: `Gedankenexperiment on Gravitational Collapse and Extreme Metrics:
When Karl Schwarzschild derived the exact vacuum solution to my field equations in 1916 (ds² = -(1 - 2GM/rc²)c²dt² + (1 - 2GM/rc²)⁻¹dr² + r²dΩ²), I considered the event horizon a purely mathematical boundary. Today, observational astrophysics has validated what pure theory could only dream of:

1. JWST's Early-Universe "Little Red Dots": High-redshift NIRCam/NIRSpec observations (z > 4 to 8) reveal compact, extremely red galactic nuclei harboring over-massive supermassive black holes ($10^7 - 10^9\\,M_\\odot$). These seed black holes challenge standard Eddington accretion limits ($L_{\\text{Edd}} = \\frac{4\\pi G M m_p c}{\\sigma_T}$), demanding either direct-collapse black hole seeds (DCBH) from pristine primordial gas or super-Eddington accretion phases in deep gravitational wells.
2. Triple Supermassive Black Hole Systems: When three massive galactic nuclei merge, relativistic 3-body dynamics govern the orbital evolution. Chaotic gravitational sling-shot interactions (governed by the post-Newtonian tensor expansion) induce extreme eccentricities, accelerating gravitational wave radiation and overcoming the "final parsec problem" to force rapid coalescence.
3. Theoretical Black Hole Fission: By Stephen Hawking's second law of black hole mechanics, the total event horizon surface area cannot decrease: $\\Delta A \\ge 0$. A single Kerr black hole cannot split spontaneously into two smaller classical horizons without violating the area theorem. However, through the Penrose process, energy and angular momentum can be extracted from the ergosphere ($r_E = M + \\sqrt{M^2 - a^2\\cos^2\\theta}$), where particles break apart and inject negative energy states into the horizon while liberating net relativistic power to infinity!`,
          eli10: `Einstein says: Black holes are nature's ultimate gravitational sinkholes. JWST has spotted 'baby' universe black holes that grew impossibly fast, while triple black hole systems play a chaotic gravitational dance until they crash together!`,
        };
      } else if (query.includes('light') || query.includes('beam') || query.includes('ride')) {
        return {
          response: `Ah, my young friend! You ask about riding alongside a beam of light—the very thought experiment (Gedankenexperiment) that seized my imagination in Aarau when I was just sixteen. If you could move at velocity c alongside an electromagnetic wave, Maxwell's electrodynamics would suggest you see a frozen, time-invariant spatial oscillation: E(x) = E_0 sin(kx). Yet such a state cannot exist in nature, for the speed of light must be an invariant constant c in every inertial reference frame! On ${target}, we observe this principle in every relativistic photon redshift. Space and time bend so that light remains absolute.`,
          eli10: `Einstein says: You can never catch up to light! Even if you fly in a rocket at near-light speed, light will still zoom past you at 186,000 miles per second because space and time squash and stretch to keep light's speed constant.`,
        };
      } else if (query.includes('gravity') || query.includes('warp') || query.includes('space') || query.includes('time')) {
        return {
          response: `Look at the geometry of spacetime around ${target}: Matter tells spacetime how to curve, and curved spacetime tells matter how to move (G_{μν} + Λg_{μν} = 8πG/c⁴ T_{μν}). When our sensors detect an anomaly such as a gravitational caustic or an Alcubierre warp metric fluctuation, we are examining local perturbations in the metric tensor g_{μν}. There is no 'spooky action at a distance'—only geodesics traced through curved Riemannian geometry.`,
          eli10: `Einstein says: Gravity isn't a magnet pulling objects down; it's heavy stars bending the invisible trampoline of space and time. Planets simply roll along the curves made by stars!`,
        };
      } else {
        return {
          response: `From the perspective of general relativity, every observation on ${target} must respect Lorentz covariance. When analyzing ${targetContext.anomalyTitle || 'this system'}, our tensor calculations confirm that time dilation factors γ = 1/√(1 - v²/c²) match geodesic trajectories. Nature's equations are simplest when expressed in invariant geometric form.`,
          eli10: `Einstein says: Nature loves elegance. Time ticks slower for fast-moving ships or objects near massive stars, exactly as mathematics predicts.`,
        };
      }

    case 'STELLA_02': // Richard Feynman
      if (query.includes('black hole') || query.includes('little red dot') || query.includes('triple') || query.includes('fission')) {
        return {
          response: `Look, let's talk straight about what's actually happening around these black holes without the theoretical mumbo-jumbo!

1. Those JWST "Little Red Dots": Nature is laughing at our computer simulations! These objects are compact as a marble compared to normal galaxies, yet they're glowing like mad in the infrared with broad H-alpha spectral lines. From a quantum electrodynamics standpoint, you're packing $10^8$ solar masses of gas into a region just a few light-years across. The photon-electron scattering (Compton scattering and synchrotron cooling) is so violent that radiation pressure is constantly fighting gravity at the very brink of the quantum horizon!
2. Triple Supermassive Black Holes: Think of it like a chaotic three-body billiard table in curved spacetime. In quantum mechanics, we calculate path integrals over all trajectories. Here, two black holes form a tight binary, and the third intruder swoops in. The third guy steals orbital energy via the Kozai-Lidov resonance, pumping the inner binary's eccentricity close to $e \\sim 0.999$, so they slam into each other and radiate monster gravitational chirps that shake the whole universe!
3. Black Hole Fission & Energy Extraction: Classically, can a black hole just split in two like a biological cell? No, because the horizon area theorem is strictly monotonic: you can't decrease entropy! But here's the fun quantum trick: Penrose scattering and superradiance. If you throw a particle into the spinning ergosphere and it decays into two pieces with one falling in on a negative-energy orbit ($\omega < m\\Omega_H$), the other piece flies out with MORE energy than you started with! Nature lets you mine energy straight out of spinning spacetime itself.`,
          eli10: `Feynman says: You can't break a black hole in two like a cookie, but you CAN steal energy from its spinning spacetime like throwing a ball into a cosmic merry-go-round and catching it moving twice as fast!`,
        };
      } else if (query.includes('quantum') || query.includes('probability') || query.includes('radio')) {
        return {
          response: `Look, don't worry about what quantum mechanics 'means' in everyday intuition—nobody understands quantum mechanics that way! What we do is calculate the sum over all possible paths (⟨f|i⟩ = ∫ D[x(t)] e^(iS/ħ)). For ${target}'s radio carrier telemetry, when SETI-Sentinel locks a 1.8 Hz narrowband tone, every photon took every possible route from the host star to our antenna dish. The probability amplitudes only interfere constructively along paths that preserve the linear -0.32 Hz/s Doppler drift!`,
          eli10: `Feynman says: Particles like photons explore every crazy path at once like playful squirrels, but their math cancels out so only the most probable journey arrives at our radio dish!`,
        };
      } else {
        return {
          response: `The first principle is that you must not fool yourself—and you are the easiest person to fool! In our telemetry from ${target}, we test every hypothesis against clean experiment. If an anomaly doesn't match the photon statistics of the Poisson-Planck distribution, then it's wrong, no matter how clever the theorist is.`,
          eli10: `Feynman says: Always test your ideas with experiments! If the real data says no, then your theory is wrong, no matter how famous you are.`,
        };
      }

    case 'STELLA_03': // Carl Sagan
      if (query.includes('dyson') || query.includes('alien') || query.includes('civilization') || query.includes('life')) {
        return {
          response: `We are a way for the cosmos to know itself. When we gaze upon ${target} and detect an excess of mid-infrared waste heat (+3.42σ in WISE W3/W4), we must remember Freeman Dyson's vision: any advanced civilization that outgrows its planet must eventually harvest the full luminosity of its parent star. A swarm of solar collectors operating at 218 K re-radiates precisely what we are seeing. Somewhere, something incredible is waiting to be known.`,
          eli10: `Sagan says: Alien civilizations might build giant solar panel clouds around their star to catch all its power. The leftover heat shines in infrared light, like a warm hand in the cold night.`,
        };
      } else {
        return {
          response: `The size and age of the Cosmos are beyond ordinary human understanding. All of our history has unfolded on a pale blue dot, a lonely speck in the great enveloping cosmic dark. Around ${target}, our spectra suggest complex photochemical molecules. If life has found a toehold there, it is part of the grand tapestry of cosmic evolution.`,
          eli10: `Sagan says: We live on a tiny dust speck in an enormous ocean of stars. Exploring new planets is how our universe looks into the mirror to see itself.`,
        };
      }

    case 'STELLA_04': // Isaac Newton
      return {
        response: `To every action there is always opposed an equal reaction; and the mutual actions of two bodies upon each other are always directed to contrary parts. On ${target}, the planet and exomoon orbit their mutual barycenter within the Hill sphere: R_Hill = a_p ∛(m_p / 3M_*). When we observe the 8.4-minute transit timing variation (TTV), it is the gravitational tug of the satellite perturbing the primary planet's Keplerian ellipse, perfectly obeying the inverse-square law F = G m₁m₂ / r².`,
        eli10: `Newton says: Gravitation is like an invisible tug-of-war. An exomoon pulls slightly on its parent planet, causing it to arrive a few minutes early or late for its transit dip!`,
      };

    case 'STELLA_05': // Nikola Tesla
      return {
        response: `If you want to find the secrets of the universe, think in terms of energy, frequency and vibration. The signals we intercept from ${target} are not mere noise; they are electromagnetic Poynting vectors (S = 1/μ₀ (E × B)) propagating across thousands of light-years. By synchronizing our resonators to the hydrogen line at 1420.45 MHz, we bypass the chaotic interstellar synchrotron fields and tune directly into the celestial frequency harmonics.`,
        eli10: `Tesla says: Everything in the universe vibrates like musical strings. By tuning our receivers to the exact radio frequency, we hear clear cosmic broadcasts above background static.`,
      };

    case 'STELLA_06': // Marie Curie
      return {
        response: `Nothing in life is to be feared, it is only to be understood. Now is the time to understand more, so that we may fear less. In the transmission spectra of ${target}, we isolate molecular absorption bands: the cross-section σ(λ) of methane at 3.3 µm and ozone at 9.6 µm. Just as radium emits radiant alpha particles through spontaneous nuclear disintegration, these molecules absorb stellar illumination in discrete, immutable quantum leaps that reveal the chemistry of alien skies.`,
        eli10: `Curie says: Molecules leave unique fingerprints in starlight. When starlight shines through an alien atmosphere, gases like methane and ozone block specific colors so we can see what the air is made of!`,
      };

    case 'STELLA_07': // Pythagoras
    default:
      return {
        response: `Number rules the universe. All astronomical anomalies are ultimately expressions of geometric harmony and rational ratios. I have calibrated our Grand Tribunal noise filter: we eliminate ground RFI, solar flares, and cosmic ray spikes with our 7.0-sigma gold standard. For ${target}, every harmonic transit frequency has been validated, and the resulting mathematical proof is stamped with an indelible SHA-256 cryptographic seal.`,
        eli10: `Pythagoras says: Mathematics is the universal language. We filter out the noisy static so only real, true discoveries are certified with an unbreakable seal!`,
      };
  }
}
