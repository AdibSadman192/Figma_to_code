import { render } from '@testing-library/react';
import Background from './background';

describe('Background Component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Background />);
    expect(container).toBeInTheDocument();
  });

  it('has the correct gradient elements', () => {
    const { container } = render(<Background />);
    const gradients = container.querySelectorAll('div[style*="radial-gradient"]');
    expect(gradients.length).toBeGreaterThan(0);
  });

  it('applies blur effect', () => {
    const { container } = render(<Background />);
    const blurElements = container.querySelectorAll('div[style*="blur"]');
    expect(blurElements.length).toBeGreaterThan(0);
  });
});
