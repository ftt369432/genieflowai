import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

function TestComponent() {
  return <div>Hello, Test!</div>;
}

describe('Basic React Test Suite', () => {
  it('should render a component', () => {
    render(<TestComponent />);
    expect(screen.getByText('Hello, Test!')).toBeInTheDocument();
  });
}); 