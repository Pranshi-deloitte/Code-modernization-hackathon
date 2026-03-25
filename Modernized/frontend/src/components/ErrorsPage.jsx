import { useStatus } from '../hooks/useStatus';
import { killApp, throwError } from '../api/albums';
import StatusMessage from './StatusMessage';

// Replaces ErrorsController + errors.html
export default function ErrorsPage() {
  const { status, success, error, clear } = useStatus();

  async function kill() {
    try {
      await killApp();
      success('Kill signal sent');
    } catch (e) {
      error('Error sending kill: ' + e.message);
    }
  }

  async function throwException() {
    try {
      await throwError();
    } catch (e) {
      error('Server returned error: ' + e.message);
    }
  }

  return (
    <div>
      <div className="page-header mb-3">
        <h1>Force Errors</h1>
      </div>

      <StatusMessage status={status} onClear={clear} />

      <div className="d-flex gap-3">
        <button className="btn btn-danger" onClick={kill}>
          Kill
        </button>
        <button className="btn btn-warning" onClick={throwException}>
          Throw Exception
        </button>
      </div>
    </div>
  );
}
