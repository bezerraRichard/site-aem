import { createRoot } from 'react-dom/client';
import CreditSimulator from './CreditSimulator.jsx';

/**
 * Renders the simulator into a container element.
 * @param {Element} container The element to render into
 * @param {object} props The simulator settings
 */
export default function mount(container, props) {
  createRoot(container).render(<CreditSimulator {...props} />);
}
