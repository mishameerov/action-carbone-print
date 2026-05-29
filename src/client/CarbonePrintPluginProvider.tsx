import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CarbonePrintActionInitializer } from './CarbonePrintActionInitializer';
import { useCarbonePrintAction } from './useCarbonePrintAction';

export const CarbonePrintPluginProvider: React.FC<any> = (props) => {
  return (
    <SchemaComponentOptions
      components={{
        CarbonePrintActionInitializer,
      }}
      scope={{
        useCarbonePrintAction,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
