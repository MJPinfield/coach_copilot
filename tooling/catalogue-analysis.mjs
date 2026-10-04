// Explicit source-label mappings. Do not infer anatomy from exercise names or the
// dataset's inconsistent muscle_group field. Regions such as "spine" stay unmapped.
const groups = {
  abs: 'abdominals', abdominals: 'abdominals', quads: 'quadriceps', quadriceps: 'quadriceps',
  pectorals: 'chest', chest: 'chest', calves: 'calves', glutes: 'glutes', hamstrings: 'hamstrings',
  adductors: 'hip_adductors', abductors: 'hip_abductors', triceps: 'triceps', biceps: 'biceps',
  delts: 'deltoids', deltoids: 'deltoids', forearms: 'forearms', 'upper back': 'upper_back',
  back: 'back', 'hip flexors': 'hip_flexors', obliques: 'obliques', 'rotator cuff': 'rotator_cuff',
  rhomboids: 'rhomboids', 'wrist flexors': 'wrist_flexors', 'wrist extensors': 'wrist_extensors',
};
const muscles = {
  lats: 'latissimus_dorsi', 'latissimus dorsi': 'latissimus_dorsi', traps: 'trapezius', trapezius: 'trapezius',
  'serratus anterior': 'serratus_anterior', 'levator scapulae': 'levator_scapulae',
  soleus: 'soleus', brachialis: 'brachialis', sternocleidomastoid: 'sternocleidomastoid',
};
// Conservative initial family membership, checked against the pinned catalogue.
// Deliberately excludes JM presses and other debatable relatives.
const benchPressIds = new Set(['0025', '0033', '0047', '0289', '0301', '0314', '0748', '0753', '0757']);
export const mappingVersion = 'exercise-analysis-v1';

export function classifyExercise(record, taxonomy) {
  const mappings = new Map();
  const unmapped = [];
  for (const [label, role] of [[record.target, 'primary'], ...(record.secondary_muscles ?? []).map(x => [x, 'secondary'])]) {
    const group = groups[label];
    const muscle = muscles[label];
    if (!group && !muscle) { if (label) unmapped.push(label); continue; }
    const key = group ? 'muscle_group_id' : 'muscle_id';
    const id = (group ? taxonomy.groups : taxonomy.muscles).get(group ?? muscle);
    if (!id) throw new Error(`Missing taxonomy entry: ${group ?? muscle}`);
    if (!mappings.has(id)) mappings.set(id, { [key]: id, role });
  }
  return { family_id: benchPressIds.has(record.id) ? taxonomy.benchPress : null, mappings: [...mappings.values()], unmapped };
}

export async function catalogueAnalysis(admin, checked, sourceReference) {
  const [groups, muscles, families] = await Promise.all([
    admin.from('muscle_groups').select('id,slug'), admin.from('muscles').select('id,slug'),
    admin.from('exercise_families').select('id,slug'),
  ]);
  const taxonomy = {
    groups: new Map(checked(groups).map(x => [x.slug, x.id])),
    muscles: new Map(checked(muscles).map(x => [x.slug, x.id])),
    benchPress: checked(families).find(x => x.slug === 'bench_press')?.id,
  };
  if (!taxonomy.benchPress) throw new Error('Missing bench press family');
  const latest = new Map();
  for (let offset = 0; ; offset += 1000) {
    const page = checked(await admin.from('exercise_analysis_revisions')
      .select('id,exercise_id,revision,provenance,source_reference').order('id').range(offset, offset + 999));
    for (const r of page) if (!latest.has(r.exercise_id) || latest.get(r.exercise_id).revision < r.revision) latest.set(r.exercise_id, r);
    if (page.length < 1000) break;
  }
  const unresolved = new Set();
  return {
    unresolved,
    async import(exerciseId, record) {
      const previous = latest.get(exerciseId);
      // A dataset refresh must never silently supersede a coach's reviewed mapping.
      if (previous?.provenance === 'coach_reviewed' || previous?.source_reference === sourceReference) return;
      const classification = classifyExercise(record, taxonomy);
      classification.unmapped.forEach(x => unresolved.add(x));
      if (!previous && !classification.mappings.length && !classification.family_id) return;
      const revision = checked(await admin.rpc('revise_exercise_analysis', {
        exercise_id: exerciseId, family_id: classification.family_id, provenance: 'imported',
        source_reference: sourceReference, mappings: classification.mappings,
      }));
      latest.set(exerciseId, revision);
    },
  };
}
