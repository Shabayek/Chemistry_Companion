import { useParams, Link } from 'react-router-dom';
import { getMission } from '../../data/missions';
import { MissionRun } from './MissionRun';

export default function MissionPage() {
  const { id } = useParams<{ id: string }>();
  const mission = id ? getMission(id) : undefined;
  if (!mission) {
    return (
      <div className="card text-center">
        <p>Mission not found.</p>
        <Link to="/" className="btn btn-primary mt-3">Home</Link>
      </div>
    );
  }
  // Keyed by id so navigating between missions always starts fresh.
  return <MissionRun key={mission.id} mission={mission} />;
}
