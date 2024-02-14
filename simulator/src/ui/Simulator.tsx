import React from 'react';
import { Accordion } from './Accordion';
import StringTransformationComponent from '../components/programIdToAddress';

export const Simulator: React.FC = () => {
  return (
    <div>
      <Accordion title={'Params'}>
        <div>this is where i would put my params if i had any</div>
      </Accordion>
      <Accordion title={'Simulator'}>
        <div>this is where i would put my simulator if i had one</div>
      </Accordion>
      <Accordion title={'Program Addresses'}>
        <StringTransformationComponent />
      </Accordion>
    </div>
  )
};