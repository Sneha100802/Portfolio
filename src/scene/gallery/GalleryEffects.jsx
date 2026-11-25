import { Bloom, DepthOfField, EffectComposer, N8AO, Noise, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';

export default function GalleryEffects({ quality, hero, deskFocus }) {
  return (
    <EffectComposer multisampling={0}>
      {quality === 2 && <N8AO aoRadius={0.72} intensity={0.78} distanceFalloff={1.2} quality="low" />}
      {quality === 2 && hero && <DepthOfField focusDistance={0.084} focalLength={0.045} bokehScale={0.22} height={360} />}
      {quality === 2 && deskFocus && <DepthOfField target={deskFocus} worldFocusRange={2.1} focalLength={0.045} bokehScale={0.85} height={360} />}
      <Bloom mipmapBlur luminanceThreshold={1.1} intensity={0.24} luminanceSmoothing={0.07} />
      <Vignette eskil={false} offset={0.14} darkness={0.38} />
      <Noise opacity={0.026} premultiply />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
