import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HUD from '../../src/ui/HUD.jsx';

describe('HUD Component', () => {
  it('should render score', () => {
    render(<HUD score={1000} lives={3} level={1} fuel={100} />);
    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('should render lives', () => {
    render(<HUD score={1000} lives={3} level={1} fuel={100} />);
    expect(screen.getByText('❤️❤️❤️')).toBeInTheDocument();
  });

  it('should render level', () => {
    render(<HUD score={1000} lives={3} level={1} fuel={100} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('should render fuel label', () => {
    render(<HUD score={1000} lives={3} level={1} fuel={100} />);
    expect(screen.getByText('FUEL')).toBeInTheDocument();
  });

  it('should render all HUD items', () => {
    render(<HUD score={5000} lives={2} level={3} fuel={50} />);
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.getByText('❤️❤️')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('FUEL')).toBeInTheDocument();
  });
});
