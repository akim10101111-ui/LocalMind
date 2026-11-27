import React from 'react';
import {SoRaLogo} from '../../../assets/icons';

export type PipMascotProps = {
  width?: number;
};

/** LocalMind assistant mark used on the final onboarding screen. */
export const PipMascot: React.FC<PipMascotProps> = ({width = 66}) => (
  <SoRaLogo width={width} height={width} />
);
