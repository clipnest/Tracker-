import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Habit, HabitFrequency, db } from '../../db/database';
import { habitService } from '../../db/habitService';
import { useSnackbar } from '../../contexts/SnackbarContext';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { getToday } from '../../utils/dateUtils';

interface HabitFormProps {
  habit?: Habit;
  onClose: () => void;
}

const ICONS = ['🏃','📚','💪','🧘','💧','🥗','😴','✍️','🎯','🎸','🏊','🚴','🧠','💊','🌱','🔥','⭐','🎨','🏋️','🚫','🍎','📝','🎵','🧹','🛏️'];
const COLORS = ['#8b5cf6','#6366f1','#06b6d4','#22c55e','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#a855f7'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function HabitForm({ habit, onClose }: HabitFormProps) {
  const { showSnackbar } = useSnackbar();
  const categories = useLiveQuery(() => db.categories.toArray()) || [];

  const [name, setName] = useState(habit?.name || '');
  const [mode, setMode] = useState<Habit['mode']>(habit?.mode || 'good');
  const [type, setType] = useState<Habit['type']>(habit?.type || 'simple');
  const [category, setCategory] = useState(habit?.category || 'Health');
  const [freqType, setFreqType] = useState<HabitFrequency['type']>(habit?.frequency.type || 'daily');
  const [weekdays, setWeekdays] = useState<number[]>(habit?.frequency.weekdays || [1,2,3,4,5]);
  const [weeklyTarget, setWeeklyTarget] = useState(habit?.frequency.weeklyTarget || 3);
  const [monthlyTarget, setMonthlyTarget] = useState(habit?.frequency.monthlyTarget || 20);
  const [target, setTarget] = useState(habit?.target?.toString() || '');
  const [targetUnit, setTargetUnit] = useState<Habit['targetUnit']>(habit?.targetUnit || 'reps');
  const [startDate, setStartDate] = useState(habit?.startDate || getToday());
  const [color, setColor] = useState(habit?.color || COLORS[0]);
  const [icon, setIcon] = useState(habit?.icon || '🎯');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const toggleWeekday = (d: number) => {
    setWeekdays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort());
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name is required';
    if ((type === 'count' || type === 'duration') && (!target || isNaN(Number(target)) || Number(target) <= 0))
      e.target = 'Enter a valid target (positive number)';
    if (freqType === 'weekdays' && weekdays.length === 0) e.weekdays = 'Select at least one day';
    if (!startDate) e.startDate = 'Start date is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const frequency: HabitFrequency =
        freqType === 'daily' ? { type: 'daily' }
        : freqType === 'weekdays' ? { type: 'weekdays', weekdays }
        : freqType === 'weekly_target' ? { type: 'weekly_target', weeklyTarget }
        : { type: 'monthly_target', monthlyTarget };

      const now = new Date().toISOString();
      const data: Omit<Habit, 'id'> = {
        name: name.trim(), mode, type, category, frequency,
        target: (type !== 'simple' && target) ? Number(target) : undefined,
        targetUnit: type !== 'simple' ? targetUnit : undefined,
        startDate, color, icon, isActive: true, isPaused: false,
        createdAt: habit?.createdAt || now, updatedAt: now,
      };

      if (habit?.id) {
        await habitService.updateHabit(habit.id, data);
        showSnackbar('Habit updated', 'success');
      } else {
        await habitService.createHabit(data);
        showSnackbar('Habit created! 🎯', 'success');
      }
      onClose();
    } catch {
      showSnackbar('Failed to save habit', 'error');
    } finally {
      setSaving(false);
    }
  };

  const catOptions = categories.map(c => ({ value: c.name, label: c.name }));
  if (!catOptions.length) catOptions.push({ value: 'Health', label: 'Health' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ flexShrink: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Icon</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, maxWidth: 180 }}>
            {ICONS.map(em => (
              <button key={em} onClick={() => setIcon(em)} aria-label={`Select icon ${em}`}
                style={{ fontSize: 18, padding: '3px 5px', borderRadius: 7, border: icon === em ? `2px solid ${color}` : '2px solid transparent', background: icon === em ? `${color}22` : 'transparent', cursor: 'pointer', lineHeight: 1.4 }}>
                {em}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Color</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 160 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} aria-label={`Select color ${c}`}
                style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', outline: 'none', boxSizing: 'border-box' }} />
            ))}
          </div>
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Preview</span>
          </div>
        </div>
      </div>

      <Input label="Habit Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Morning workout" error={errors.name} maxLength={60} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 6 }}>Mode</p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['good', 'avoidance'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `1px solid ${mode === m ? color : 'var(--border-color)'}`, background: mode === m ? `${color}20` : 'var(--bg-elevated)', color: mode === m ? color : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: mode === m ? 600 : 400, textTransform: 'capitalize' }}>
                {m}
              </button>
            ))}
          </div>
        </div>
        <Select label="Type" value={type} onChange={e => setType(e.target.value as Habit['type'])} options={[
          { value: 'simple', label: 'Simple' },
          { value: 'count', label: 'Count' },
          { value: 'duration', label: 'Duration' },
        ]} />
      </div>

      {type !== 'simple' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label={type === 'count' ? 'Target reps' : 'Target minutes'} type="number" value={target}
            onChange={e => setTarget(e.target.value)} placeholder="e.g., 50" min="1" error={errors.target} />
          <Select label="Unit" value={targetUnit || 'reps'}
            onChange={e => setTargetUnit(e.target.value as Habit['targetUnit'])}
            options={[{ value: 'reps', label: 'Reps' }, { value: 'minutes', label: 'Minutes' }, { value: 'hours', label: 'Hours' }]} />
        </div>
      )}

      <Select label="Category" value={category} onChange={e => setCategory(e.target.value)} options={catOptions} />

      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Frequency</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {([{ v: 'daily', l: 'Daily' }, { v: 'weekdays', l: 'Specific Days' }, { v: 'weekly_target', l: 'Weekly Target' }, { v: 'monthly_target', l: 'Monthly Target' }] as const).map(({ v, l }) => (
            <button key={v} onClick={() => setFreqType(v)}
              style={{ padding: '8px 14px', borderRadius: 20, border: `1px solid ${freqType === v ? color : 'var(--border-color)'}`, background: freqType === v ? `${color}20` : 'var(--bg-elevated)', color: freqType === v ? color : 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: freqType === v ? 600 : 400 }}>
              {l}
            </button>
          ))}
        </div>
        {freqType === 'weekdays' && (
          <div>
            <div style={{ display: 'flex', gap: 6 }}>
              {DAYS.map((d, i) => (
                <button key={i} onClick={() => toggleWeekday(i)}
                  style={{ flex: 1, padding: '8px 2px', borderRadius: 8, border: `1px solid ${weekdays.includes(i) ? color : 'var(--border-color)'}`, background: weekdays.includes(i) ? `${color}25` : 'var(--bg-elevated)', color: weekdays.includes(i) ? color : 'var(--text-secondary)', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>
                  {d}
                </button>
              ))}
            </div>
            {errors.weekdays && <p style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{errors.weekdays}</p>}
          </div>
        )}
        {freqType === 'weekly_target' && (
          <Input label="Times per week" type="number" value={weeklyTarget.toString()} onChange={e => setWeeklyTarget(Math.max(1, Math.min(7, Number(e.target.value))))} min="1" max="7" />
        )}
        {freqType === 'monthly_target' && (
          <Input label="Times per month" type="number" value={monthlyTarget.toString()} onChange={e => setMonthlyTarget(Math.max(1, Math.min(31, Number(e.target.value))))} min="1" max="31" />
        )}
      </div>

      <Input label="Start Date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} error={errors.startDate} />

      <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
        <Button variant="ghost" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving} style={{ flex: 2, background: color, color: '#fff' }}>
          {saving ? 'Saving...' : habit ? 'Save Changes' : 'Create Habit'}
        </Button>
      </div>
    </div>
  );
}
