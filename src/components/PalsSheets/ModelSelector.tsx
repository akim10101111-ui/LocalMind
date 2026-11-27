import React from 'react';
import {observer} from 'mobx-react';
import {Selector, SelectorOption} from '../Selector';
import {modelStore} from '../../store';
import {Model} from '../../utils/types';

interface ModelSelectorProps {
  value?: Model;
  onChange: (value: Model) => void;
  label: string;
  sublabel?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  filter?: (model: Model) => boolean;
  testID?: string;
}

export const ModelSelector = observer(
  ({
    value,
    onChange,
    label,
    sublabel,
    placeholder = 'Select model',
    error,
    helperText,
    required,
    disabled,
    filter,
    testID,
  }: ModelSelectorProps) => {
    // Convert models to selector options
    // SoRa is a single-model product. Keep the existing selector contract
    // for assistant editors, but expose only the configured cloud model.
    const soraModels = modelStore.remoteModels.filter(
      model => model.remoteModelId === 'glm-4-plus',
    );
    const options: SelectorOption<string>[] = soraModels
      .filter(model => (filter ? filter(model) : true))
      .map(model => ({
        label: 'SoRa',
        value: model.id,
      }));

    const handleModelChange = (modelId: string) => {
      const selectedModel = soraModels.find(model => model.id === modelId);
      if (selectedModel) {
        onChange(selectedModel);
      }
    };

    return (
      <Selector
        options={options}
        value={value?.id || ''}
        onChange={handleModelChange}
        label={label}
        sublabel={sublabel}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        error={error}
        helperText={helperText}
        testID={testID}
      />
    );
  },
);
