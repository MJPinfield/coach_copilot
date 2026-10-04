import { clients, checked } from './seed-backend.mjs';
import { catalogueAnalysis, mappingVersion } from './catalogue-analysis.mjs';

const source = 'hasaneyldrm/exercises-dataset';
const revision = '7455efae41b330c265e7cd4b78dfa848e7ce5ebd';
const base = `https://raw.githubusercontent.com/${source}/${revision}/`;
const rights = 'Gym Visual licence confirmed by project owner, 2026-10-04';
const response = await fetch(`${base}data/exercises.json`);
if (!response.ok) throw new Error(`Dataset request failed: ${response.status}`);
const records = await response.json();
if (!Array.isArray(records) || records.length !== 1324 || new Set(records.map(x => x.id)).size !== records.length) throw new Error('Unexpected dataset identity/count');
const { admin } = clients(); // Local-only by design. Production imports are an explicit deployment task.
const analysis = await catalogueAnalysis(admin, checked, `${source}@${revision}/${mappingVersion}`);
for (const record of records) {
  if (!/^\d{4}$/.test(record.id) || !record.name || !record.instructions?.en || !Array.isArray(record.instruction_steps?.en)) throw new Error(`Invalid exercise ${record.id}`);
  for (const p of [record.image, record.gif_url]) if (!/^(images|videos)\/[\w.-]+\.(jpg|jpeg|png|gif)$/.test(p)) throw new Error(`Invalid media path ${p}`);
}
// Retain database-generated identities via source/external_id upserts, not names.
for (let offset = 0; offset < records.length; offset += 100) {
  const batch = records.slice(offset, offset + 100);
  const inserted = checked(await admin.from('exercises').upsert(batch.map(r => ({
    source, external_id: r.id, source_revision: revision, source_created_at: r.created_at,
    name: r.name, equipment: r.equipment, body_part: r.body_part, target: r.target,
    muscle_group: r.muscle_group, secondary_muscles: r.secondary_muscles,
  })), { onConflict: 'source,external_id' }).select('id,external_id'));
  const ids = new Map(inserted.map(r => [r.external_id, r.id]));
  for (const record of batch) await analysis.import(ids.get(record.id), record);
  checked(await admin.from('exercise_instructions').upsert(batch.flatMap(r => Object.entries(r.instructions).map(([locale, text]) => ({
    exercise_id: ids.get(r.id), locale, text, steps: r.instruction_steps[locale] ?? [], source_revision: revision,
  }))), { onConflict: 'exercise_id,locale' }));
  checked(await admin.from('exercise_media').upsert(batch.flatMap(r => [['thumbnail', r.image], ['animation', r.gif_url]].map(([kind, path]) => ({
    exercise_id: ids.get(r.id), kind, source_media_id: r.media_id, source_path: path,
    source_revision: revision, asset_url: `${base}${path}`, attribution: r.attribution,
    rights_reference: rights,
  }))), { onConflict: 'exercise_id,kind' }));
}
console.log(`Imported ${records.length} real exercises, instructions and licensed image/GIF references at ${revision}.`);
console.log(`Analysis labels left unmapped: ${[...analysis.unresolved].sort().join(', ') || 'none in newly classified records'}`);
