import { useEffect, useState } from 'react';
import { 
    getMilestoneProgress,
    getMyBadges,
    updateShowcasedBadges, 
    type MilestoneProgress, 
    type UserBadge 
} from '../api';
import { LoadingState, ErrorDisplay } from '.';
import styles from '../styles/Badges.module.css';


const MAX_SHOWCASED_BADGES = 3;

export function Badges(){
    const [milestones, setMilestones] = useState<MilestoneProgress[]>([]);
    const [badges, setBadges] = useState<UserBadge[]>([]);
    const [selected, setSelected] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadBadges() {
            try{
                const [milestonesData, badgesData] = await Promise.all([
                    getMilestoneProgress(),
                    getMyBadges()
                ]);

                setMilestones(milestonesData);
                setBadges(badgesData);
                setSelected(
                    badgesData
                    .filter((badge) => badge.showcased)
                    .map((badge) => badge.milestoneId)
                );
            } catch (err) {
                setError('Failed to load badges');
            } finally {
                setLoading(false);
            }
        }
        loadBadges();
    }, []);

    function toggleShowcase(milestoneId: string) {
        setSelected((current) => {
            if (current.includes(milestoneId)) {
            return current.filter((id) => id !== milestoneId);
            }

            if (current.length >= MAX_SHOWCASED_BADGES) {
            return current;
            }

            return [...current, milestoneId];
        });
        }

    async function saveShowcase() {
    setSaving(true);
    setError(null);

    try {
      const updated = await updateShowcasedBadges(selected);
      setBadges(updated);
    } catch {
      setError('Unable to update showcased badges');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorDisplay message={error} />;
  }

    
    return (
        <section className={styles.container}>
            <h2>Badges and Milestone</h2>

            {milestones.length === 0 && <p>No milestones available yet.</p>}
            
            {milestones.map((milestone)=> {
                const earnedBadge = badges.find(
                    (badge) => badge.milestoneId === milestone.milestoneId
                );

                const isShowcased = selected.includes(milestone.milestoneId);
                return(
                    <article key={milestone.milestoneId} className={styles.card}>
                        <h3>{milestone.badge.displayName}</h3>
                        <p>{milestone.badge.description}</p>
                        <p>
                        {milestone.correct} / {milestone.required} mastered
                        </p>
                         <progress
                        value={milestone.correct}
                        max={milestone.required}
                        />

                        <p>Status: {milestone.status}</p>

                        {earnedBadge && (
                        <button
                            type="button"
                            onClick={() => toggleShowcase(milestone.milestoneId)}
                        >
                            {isShowcased ? 'Remove from showcase' : 'Showcase badge'}
                        </button>
                        )}
                    </article>
                );
            })}
            <p>
                Showcased: {selected.length} / {MAX_SHOWCASED_BADGES}
            </p>

            <button
                type="button"
                onClick={saveShowcase}
                disabled={saving}
            >
                {saving ? 'Saving...' : 'Save showcase'}
            </button>
        </section>

        


    )
}