import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateStellaChatResponse } from './stellaConversationalEngine';

describe('stellaConversationalEngine', () => {
  it('generates distinct in-character responses for Einstein with ELI10 translation', () => {
    const res = generateStellaChatResponse('STELLA_01', 'Can I ride alongside a beam of light?', {
      name: 'TIC-25155310',
      anomalyTitle: 'Dyson Sphere Candidate',
    });
    assert.ok(res.response.includes('thought experiment') || res.response.includes('Gedankenexperiment'));
    assert.ok(res.eli10.includes('Einstein says:'));
    assert.ok(res.eli10.length > 20);
  });

  it('generates Feynman response with path integral principles and playful tone', () => {
    const res = generateStellaChatResponse('STELLA_02', 'How does quantum probability explain the radio signal?', {
      name: 'Proxima Centauri',
    });
    assert.ok(res.response.includes('sum over all possible paths') || res.response.includes('Feynman'));
    assert.ok(res.eli10.includes('Feynman says:'));
  });

  it('generates Sagan response citing pale blue dot or Dyson swarm waste heat', () => {
    const res = generateStellaChatResponse('STELLA_03', 'Is this Dyson sphere built by an alien civilization?', {
      name: 'TIC-25155310',
    });
    assert.ok(res.response.includes('Freeman Dyson') || res.response.includes('pale blue dot'));
    assert.ok(res.eli10.includes('Sagan says:'));
  });

  it('generates Pythagoras response with noise filter and mathematical harmony', () => {
    const res = generateStellaChatResponse('STELLA_07', 'How do you filter noise?', {
      name: 'Kepler-452 b',
    });
    assert.ok(res.response.includes('Number rules the universe') || res.response.includes('SHA-256'));
    assert.ok(res.eli10.includes('Pythagoras says:'));
  });

  it('generates Einstein and Feynman briefings on JWST little red dots, triple black holes, and fission', () => {
    const einsteinRes = generateStellaChatResponse('STELLA_01', 'Brief me on black hole discoveries and little red dots', {
      name: 'GW-260114',
    });
    assert.ok(einsteinRes.response.includes('Little Red Dots'));
    assert.ok(einsteinRes.response.includes('Triple Supermassive Black Hole'));
    assert.ok(einsteinRes.response.includes('Penrose process') || einsteinRes.response.includes('Hawking'));

    const feynmanRes = generateStellaChatResponse('STELLA_02', 'Tell me about black holes, little red dots, and fission', {
      name: 'GW-260114',
    });
    assert.ok(feynmanRes.response.includes('Little Red Dots'));
    assert.ok(feynmanRes.response.includes('Kozai-Lidov'));
    assert.ok(feynmanRes.eli10.includes('Feynman says:'));
  });
});
