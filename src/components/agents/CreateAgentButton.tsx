import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { CreateAgentModal } from './CreateAgentModal';

export function CreateAgentButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        size="sm"
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        New Agent
      </Button>

      {showModal && (
        <CreateAgentModal
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
} 