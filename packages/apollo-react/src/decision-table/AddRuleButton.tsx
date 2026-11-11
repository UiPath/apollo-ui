import { Button } from '@uipath/apollo-wind';
import { Plus } from 'lucide-react';
import type React from 'react';

export interface AddRuleButtonProps {
  label: string;
  onAdd: () => void;
}

export const AddRuleButton: React.FC<AddRuleButtonProps> = ({ label, onAdd }) => (
  <Button variant="outline" size="sm" onClick={onAdd}>
    <Plus aria-hidden />
    {label}
  </Button>
);
