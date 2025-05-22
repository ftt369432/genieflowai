  if (creationMode === 'swarm') {
    // Navigate to the new ConfigureSwarmPage with initial name and description
    navigate('/configure-swarm', { 
      state: {
        initialName: swarmName || `Swarm for: ${promptText.substring(0, 30)}...`,
        initialDescription: promptText,
      }
    });
  } else {
  } 