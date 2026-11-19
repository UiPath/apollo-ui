import { Button } from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import type React from 'react';
import { ADD_RULE_LINK_CLASS } from './sentenceStyles';

export interface AddRuleButtonProps {
  label: string;
  onAdd: () => void;
}

export const AddRuleButton: React.FC<AddRuleButtonProps> = ({ label, onAdd }) => (
  <Button variant="link" size="sm" className={ADD_RULE_LINK_CLASS} onClick={onAdd}>
    <Plus aria-hidden />
    {label}
  </Button>
);
